"use client";

import { useState } from "react";
import { Scanner, outline } from "@yudiel/react-qr-scanner";
import { supabase } from "@/lib/supabase";
import { localDB } from "@/lib/localdb";

interface AttendanceScannerProps {
  classStartTime: string | null;
  onScanSuccess?: (
    student: any,
    awardedXp: number,
    isOffline: boolean,
    isDuplicate: boolean,
  ) => void;
}

export default function AttendanceScanner({
  classStartTime,
  onScanSuccess,
}: AttendanceScannerProps) {
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanState, setScanState] = useState<
    "idle" | "processing" | "success" | "duplicate" | "error" | "offline"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Ready for next student",
  );

  const calculateDynamicXP = (scanTimestamp: string): number => {
    if (!classStartTime) return 10;
    const scanTime = new Date(scanTimestamp);
    const [hours, minutes] = classStartTime.split(":").map(Number);
    const expectedStartTime = new Date(scanTime);
    expectedStartTime.setHours(hours, minutes, 0, 0);

    const diffInMinutes = Math.floor(
      (scanTime.getTime() - expectedStartTime.getTime()) / 60000,
    );
    const baseXP = 10;

    if (diffInMinutes <= 0) return baseXP + 5;
    if (diffInMinutes >= 5) return baseXP;
    return baseXP + (5 - diffInMinutes);
  };

  const handleScan = async (scannedText: string) => {
    if (scannedText === lastScanned || !scannedText.startsWith("ICMS-")) return;

    setLastScanned(scannedText);
    setScanState("processing");
    setStatusMessage("Verifying ID...");

    const scanTimestamp = new Date().toISOString();
    const todayString = scanTimestamp.split("T")[0];
    const finalXpToAward = calculateDynamicXP(scanTimestamp);

    if (navigator.onLine) {
      try {
        const { data: student, error: fetchError } = await supabase
          .from("students")
          .select("*")
          .eq("qr_code", scannedText)
          .single();
        if (fetchError || !student) throw new Error("Student not found.");

        const startOfDay = `${todayString}T00:00:00.000Z`;
        const { data: existingLogs, error: logCheckError } = await supabase
          .from("attendance_logs")
          .select("id")
          .eq("student_id", student.id)
          .gte("scanned_at", startOfDay)
          .limit(1);
        if (logCheckError) throw logCheckError;

        if (existingLogs && existingLogs.length > 0) {
          setScanState("duplicate");
          setStatusMessage("Already Checked In");
          if (onScanSuccess) onScanSuccess(student, 0, false, true);
        } else {
          const { error: logError } = await supabase
            .from("attendance_logs")
            .insert({
              student_id: student.id,
              scanned_at: scanTimestamp,
              status: "present",
            });
          if (logError) throw logError;

          const { error: txError } = await supabase
            .from("xp_transactions")
            .insert([
              {
                student_id: student.id,
                amount: finalXpToAward,
                reason:
                  finalXpToAward > 10
                    ? "Class Attendance + Early Bonus"
                    : "Class Attendance",
              },
            ]);
          if (txError) throw txError;

          const updatedXp = student.total_xp + finalXpToAward;
          const updatedCycle = (student.cycle_classes || 0) + 1;

          await supabase
            .from("students")
            .update({
              total_xp: updatedXp,
              cycle_classes: updatedCycle,
            })
            .eq("id", student.id);

          setScanState("success");
          setStatusMessage(`Welcome, ${student.full_name.split(" ")[0]}!`);

          if (onScanSuccess) {
            onScanSuccess(
              { ...student, total_xp: updatedXp, cycle_classes: updatedCycle },
              finalXpToAward,
              false,
              false,
            );
          }
        }
      } catch (err: any) {
        if (err.message === "Student not found.") {
          setScanState("error");
          setStatusMessage("Unrecognized ID Card");
        } else {
          await saveLocally(scannedText, scanTimestamp, todayString);
        }
      }
    } else {
      await saveLocally(scannedText, scanTimestamp, todayString);
    }

    setTimeout(() => {
      setLastScanned(null);
      setScanState("idle");
      setStatusMessage("Ready for next student");
    }, 3000);
  };

  const saveLocally = async (
    studentId: string,
    timestamp: string,
    todayString: string,
  ) => {
    try {
      const offlineLogs = await localDB.offlineScans.toArray();
      const alreadyCheckedInOffline = offlineLogs.some(
        (log) =>
          log.student_id === studentId &&
          log.scanned_at.startsWith(todayString),
      );

      if (alreadyCheckedInOffline) {
        setScanState("duplicate");
        setStatusMessage("Already Checked In (Offline)");
        if (onScanSuccess)
          onScanSuccess(
            {
              full_name: "Duplicate Offline Scan",
              grade_batch: studentId,
              total_xp: "--",
            },
            0,
            true,
            true,
          );
      } else {
        await localDB.offlineScans.add({
          student_id: studentId,
          scanned_at: timestamp,
          status: "present",
        });
        setScanState("offline");
        setStatusMessage("Saved Offline");
        if (onScanSuccess)
          onScanSuccess(
            {
              full_name: "Offline Scan Logged",
              grade_batch: studentId,
              total_xp: "--",
            },
            10,
            true,
            false,
          );
      }
    } catch (dbError) {
      setScanState("error");
      setStatusMessage("Error saving scan!");
    }
  };

  if (!classStartTime) {
    return (
      <div className="w-full aspect-square max-w-sm mx-auto rounded-[2.5rem] bg-slate-100 flex flex-col items-center justify-center border-4 border-dashed border-slate-300 p-8 text-center transition-all">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner text-4xl">
          🗓️
        </div>
        <h3 className="text-2xl font-black text-slate-400 mb-2 uppercase tracking-widest">
          No Class Today
        </h3>
        <p className="text-slate-500 font-medium">
          There is no class scheduled in the system for today.
        </p>
      </div>
    );
  }

  const stateStyles = {
    idle: "border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)] bg-blue-500",
    processing:
      "border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.4)] bg-indigo-500",
    success:
      "border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)] bg-green-500",
    duplicate:
      "border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.5)] bg-amber-500",
    error: "border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)] bg-red-500",
    offline:
      "border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] bg-orange-500",
  };

  return (
    <div className="w-full flex flex-col items-center max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-6 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
        <span
          className={`w-2.5 h-2.5 rounded-full ${scanState === "idle" ? "bg-blue-500 animate-pulse" : "bg-slate-300"}`}
        ></span>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {scanState === "idle" ? "Camera Active" : "Processing"}
        </span>
      </div>

      <div
        className={`relative w-full aspect-square rounded-[2.5rem] overflow-hidden border-8 transition-all duration-300 ${stateStyles[scanState].split(" bg-")[0]} bg-slate-900`}
      >
        <Scanner
          onScan={(result) => {
            if (result && result.length > 0) handleScan(result[0].rawValue);
          }}
          formats={["qr_code"]}
          components={{ tracker: outline }}
          sound={false}
        />
      </div>

      <div className="mt-8 w-full">
        <div
          className={`w-full py-4 px-6 rounded-2xl font-black text-center text-xl tracking-wide transition-all duration-300 text-white shadow-lg ${stateStyles[scanState].split(" ")[2]} ${scanState === "duplicate" || scanState === "error" ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
        >
          {statusMessage}
        </div>
        {scanState === "idle" && (
          <p className="text-center text-slate-400 font-medium text-sm mt-4">
            Hold ID Card steady in the frame
          </p>
        )}
      </div>
    </div>
  );
}
