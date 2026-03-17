"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "../lib/supabase";
import { localDB } from "../lib/localdb";

export default function AttendanceScanner() {
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Ready to scan");

  const handleScan = async (scannedText: string) => {
    if (scannedText === lastScanned) return;
    setLastScanned(scannedText);
    setStatusMessage(`Processing: ${scannedText}...`);

    const scanTimestamp = new Date().toISOString();

    // THE NETWORK-FIRST LOGIC
    if (navigator.onLine) {
      try {
        const { error } = await supabase.from("attendance_logs").insert({
          student_id: scannedText,
          scanned_at: scanTimestamp,
          status: "present",
        });

        if (error) throw error;
        setStatusMessage("✅ Synced to Cloud!");
      } catch (err) {
        console.error("Cloud sync failed, saving locally:", err);
        await saveLocally(scannedText, scanTimestamp);
      }
    } else {
      await saveLocally(scannedText, scanTimestamp);
    }

    setTimeout(() => {
      setLastScanned(null);
      setStatusMessage("Ready to scan");
    }, 3000);
  };

  const saveLocally = async (studentId: string, timestamp: string) => {
    try {
      await localDB.offlineScans.add({
        student_id: studentId,
        scanned_at: timestamp,
        status: "present",
      });
      setStatusMessage("📦 Saved Offline (Needs Sync)");
    } catch (dbError) {
      setStatusMessage("❌ Error saving scan!");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800">
        Class Attendance
      </h2>

      <div className="rounded-lg overflow-hidden border-4 border-blue-500">
        <Scanner
          onScan={(result) => handleScan(result[0].rawValue)}
          onError={(error) => console.error(error)}
          constraints={{ facingMode: "environment" }}
        />
      </div>

      <div className="mt-6 text-center">
        <p
          className={`text-lg font-semibold ${statusMessage.includes("✅") ? "text-green-600" : statusMessage.includes("📦") ? "text-orange-500" : "text-gray-600"}`}
        >
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
