"use client";

import { useState, useEffect } from "react";
import AttendanceScanner from "@/components/AttendanceScanner";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";

export type TodaySession = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  schedule_type: string;
  target_grades: string[];
  target_students: string[];
  _origin: "regular" | "override";
};

export default function AttendanceKiosk() {
  const [lastScanned, setLastScanned] = useState<any | null>(null);
  const [justAwardedXp, setJustAwardedXp] = useState(0);
  const [isOfflineScan, setIsOfflineScan] = useState(false);
  const [isDuplicateScan, setIsDuplicateScan] = useState(false);

  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [manualSessionId, setManualSessionId] = useState<string | null>(null);
  const [scheduleStatus, setScheduleStatus] = useState<"loading" | "ready" | "none">("loading");
  const [scheduleNote, setScheduleNote] = useState("");

  useEffect(() => {
    const fetchTodaySessions = async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const localDateStr = `${year}-${month}-${day}`;
      const dayOfWeek = today.getDay();

      try {
        const { data: allSchedules, error } = await supabase
          .from("schedules")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;
        if (!allSchedules || allSchedules.length === 0) {
          setScheduleStatus("none");
          setScheduleNote("No class today");
          return;
        }

        // Find base classes for today
        const baseToday = allSchedules.filter(s =>
          (s.schedule_type === "recurring" && s.day_of_week === dayOfWeek) ||
          (s.schedule_type === "one_time" && s.specific_date === localDateStr)
        );

        // Find cross-day reschedule overrides landing today
        const rescheduleOverridesToday = allSchedules.filter(s =>
          s.schedule_type === "override" &&
          s.override_action === "reschedule" &&
          s.specific_date === localDateStr
        );

        const toLocalDate = (timeStr: string): Date => {
          const [h, m] = timeStr.split(":").map(Number);
          const d = new Date();
          d.setHours(h, m, 0, 0);
          return d;
        };
        const now = new Date();

        // Build the final session list, applying per-schedule overrides
        const sessions: TodaySession[] = [];

        for (const base of baseToday) {
          // Check for a cancel/reschedule override on this specific base class today
          const override = allSchedules.find(s =>
            s.schedule_type === "override" &&
            s.parent_schedule_id === base.id &&
            s.specific_date === localDateStr
          );

          if (override) {
            if (override.override_action === "cancel") {
              // Skip this class entirely — it's cancelled
              continue;
            }
            if (override.override_action === "reschedule") {
              // Use override times instead of base times
              sessions.push({
                id: base.id,
                title: base.title,
                start_time: override.start_time,
                end_time: override.end_time,
                schedule_type: base.schedule_type,
                target_grades: base.target_grades || [],
                target_students: base.target_students || [],
                _origin: "override",
              });
              continue;
            }
          }

          // No override — use base schedule as-is
          sessions.push({
            id: base.id,
            title: base.title,
            start_time: base.start_time,
            end_time: base.end_time,
            schedule_type: base.schedule_type,
            target_grades: base.target_grades || [],
            target_students: base.target_students || [],
            _origin: "regular",
          });
        }

        // Add any cross-day reschedule overrides that don't match an existing base
        for (const ov of rescheduleOverridesToday) {
          const alreadyIncluded = sessions.some(s => s.id === ov.parent_schedule_id);
          if (!alreadyIncluded) {
            sessions.push({
              id: ov.parent_schedule_id || ov.id,
              title: ov.title,
              start_time: ov.start_time,
              end_time: ov.end_time,
              schedule_type: "one_time",
              target_grades: ov.target_grades || [],
              target_students: ov.target_students || [],
              _origin: "override",
            });
          }
        }

        // Filter out sessions that have already ended
        const activeSessions = sessions.filter(s => {
          if (!s.end_time) return true;
          return toLocalDate(s.end_time) > now;
        });

        // Sort by start time
        activeSessions.sort((a, b) => {
          const aT = a.start_time ? toLocalDate(a.start_time).getTime() : 0;
          const bT = b.start_time ? toLocalDate(b.start_time).getTime() : 0;
          return aT - bT;
        });

        if (activeSessions.length === 0) {
          setScheduleStatus("none");
          setScheduleNote("No class today");
          return;
        }

        setTodaySessions(activeSessions);
        setManualSessionId(activeSessions[0].id);
        setScheduleStatus("ready");

        if (activeSessions.length === 1) {
          const s = activeSessions[0];
          setScheduleNote(
            s._origin === "override"
              ? "Rescheduled session"
              : s.schedule_type === "one_time"
                ? "Special session today"
                : "Regular class today"
          );
        } else {
          setScheduleNote(`${activeSessions.length} sessions today`);
        }

      } catch (error) {
        console.error("Error fetching schedule:", error);
        setScheduleStatus("none");
      }
    };

    fetchTodaySessions();
  }, []);

  const handleSuccessfulScan = (
    studentData: any,
    xp: number,
    offline: boolean,
    duplicate: boolean,
  ) => {
    setLastScanned(studentData);
    setJustAwardedXp(xp);
    setIsOfflineScan(offline);
    setIsDuplicateScan(duplicate);
  };

  const selectedSession = todaySessions.find(s => s.id === manualSessionId) || null;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8 flex flex-col font-sans">
      {/* --- EXIT BUTTON --- */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-xs font-bold uppercase tracking-widest transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm w-fit active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Scanner
        </Link>
      </div>

      {/* --- KIOSK HEADER --- */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 border-3 border-slate-800 rounded-xl shadow-lg overflow-hidden shrink-0">
            <Image
              src="/icon.png"
              alt="ICMS Logo"
              fill
              sizes="48px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              ICT Cram
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Automated Attendance Check-In
            </p>
          </div>
        </div>

        {/* SCHEDULE READOUT + SESSION SELECTOR */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Session Dropdown (only visible when multiple sessions) */}
          {todaySessions.length > 1 && (
            <div className="relative">
              <select
                value={manualSessionId || ""}
                onChange={(e) => setManualSessionId(e.target.value)}
                className="appearance-none bg-white border-2 border-blue-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 pr-10 outline-none focus:border-blue-400 cursor-pointer transition-colors shadow-sm"
              >
                {todaySessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.start_time})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Schedule Status Readout */}
          <div
            className={`flex items-center gap-4 p-3 pr-5 rounded-2xl border flex-1 md:flex-none shadow-sm ${
              scheduleStatus === "ready" && selectedSession?._origin === "override"
                ? "bg-amber-50 border-amber-200"
                : scheduleStatus === "ready"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-slate-50 border-slate-200"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                scheduleStatus === "ready" && selectedSession?._origin === "override"
                  ? "bg-amber-100 text-amber-600"
                  : scheduleStatus === "ready"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {scheduleStatus === "ready" && selectedSession?._origin === "override"
                ? "⚠️"
                : scheduleStatus === "ready"
                  ? "⏱️"
                  : "🗓️"}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {scheduleStatus === "loading"
                  ? "Loading Schedule..."
                  : scheduleNote}
              </p>
              {scheduleStatus === "ready" && selectedSession ? (
                <p className="text-lg font-black text-slate-800 font-mono tracking-tight">
                  {selectedSession.start_time} — {selectedSession.end_time || "??:??"}
                </p>
              ) : (
                <p className="text-lg font-bold text-slate-400 tracking-tight">
                  {scheduleStatus === "loading" ? "..." : "Scanner Offline"}
                </p>
              )}
            </div>
          </div>

          {/* Smart Scanner Indicator */}
          {todaySessions.length > 1 && (
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Smart Mode</span>
            </div>
          )}
        </div>
      </header>

      {/* --- SPLIT SCREEN DASHBOARD --- */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* LEFT: THE SCANNER HARDWARE */}
        <section className="lg:w-5/12 xl:w-1/3 bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-50 to-transparent -z-0"></div>

          <div className="relative z-10 w-full">
            <AttendanceScanner
              todaySessions={todaySessions}
              manualSessionId={manualSessionId}
              onScanSuccess={handleSuccessfulScan}
            />
          </div>
        </section>

        {/* RIGHT: THE LIVE FEED DISPLAY */}
        <section className="lg:w-7/12 xl:w-2/3 flex flex-col">
          <div
            className={`rounded-[2.5rem] shadow-sm border p-8 md:p-12 flex-1 flex flex-col relative overflow-hidden transition-all duration-500 ${isDuplicateScan ? "bg-amber-50 border-amber-200" : lastScanned ? "bg-white border-blue-100 shadow-[0_10px_40px_rgba(59,130,246,0.05)]" : "bg-white border-slate-200/60"}`}
          >
            {lastScanned ? (
              <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                {/* Profile Avatar */}
                <div
                  className={`w-40 h-40 rounded-full mb-8 shadow-2xl border-8 flex items-center justify-center text-7xl transform transition-transform hover:scale-105 ${isDuplicateScan ? "bg-amber-100 border-amber-200 text-amber-500" : isOfflineScan ? "bg-orange-100 border-orange-200 text-orange-500" : "bg-slate-100 border-white text-slate-400"}`}
                >
                  {isDuplicateScan ? "🛑" : isOfflineScan ? "📦" : "👤"}
                </div>

                <h3 className="text-4xl md:text-5xl font-black text-slate-800 text-center mb-3 tracking-tight">
                  {lastScanned.full_name}
                </h3>
                <p className="text-xl text-slate-500 font-bold tracking-widest uppercase mb-4">
                  {lastScanned.grade_batch}
                </p>

                {/* Matched Session Label */}
                {lastScanned._matchedSessionTitle && !isDuplicateScan && (
                  <p className="text-xs font-bold text-blue-500 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 mb-8">
                    Matched → {lastScanned._matchedSessionTitle}
                  </p>
                )}
                {!lastScanned._matchedSessionTitle && !isDuplicateScan && !isOfflineScan && (
                  <div className="mb-8"></div>
                )}

                {/* Status Banners */}
                {isDuplicateScan ? (
                  <div className="bg-white border-2 border-amber-200 p-6 rounded-3xl w-full max-w-md text-center shadow-xl shadow-amber-500/10">
                    <p className="text-xl font-black text-amber-600 uppercase tracking-widest mb-2">
                      Access Logged
                    </p>
                    <p className="text-slate-600 font-medium">
                      You have already been checked in for this session. Please
                      take your seat.
                    </p>
                  </div>
                ) : (
                  <div
                    className={`p-1.5 rounded-[2rem] w-full max-w-md transform transition-all shadow-2xl ${isOfflineScan ? "bg-slate-200" : "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]"}`}
                  >
                    <div className="bg-white rounded-[1.8rem] p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Total Rank XP
                        </p>
                        <p
                          className={`text-5xl font-black tracking-tighter ${isOfflineScan ? "text-slate-400" : "text-orange-500"}`}
                        >
                          {lastScanned.total_xp}{" "}
                          {isOfflineScan ? null : (
                            <span className="text-3xl ml-1">⭐</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end justify-center">
                        {isOfflineScan ? (
                          <p className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
                            Syncing Later
                          </p>
                        ) : (
                          <>
                            <p className="text-lg font-black text-green-600 bg-green-50 px-5 py-2 rounded-full border border-green-100 animate-[bounce_1s_ease-in-out_2]">
                              +{justAwardedXp} XP
                            </p>
                            {justAwardedXp > 10 && (
                              <p className="text-xs font-bold text-amber-500 mt-2 uppercase tracking-wider">
                                Early Bonus!
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 relative z-10 text-center px-4">
                <div className="w-32 h-32 bg-slate-50 rounded-full mb-8 flex items-center justify-center shadow-inner border-2 border-slate-100">
                  <span className="text-5xl opacity-50">✍️</span>
                </div>
                <h2 className="text-3xl font-black text-slate-300 tracking-tight mb-4">
                  Welcome to Class
                </h2>
                <p className="text-slate-400 font-medium text-lg max-w-sm">
                  Please hold your ICMS Student Card up to the camera on the
                  left to check in.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
