"use client";

import { useState, useEffect } from "react";
import AttendanceScanner from "@/components/AttendanceScanner";
import { supabase } from "@/lib/supabase";

export default function AttendanceKiosk() {
  const [lastScanned, setLastScanned] = useState<any | null>(null);
  const [justAwardedXp, setJustAwardedXp] = useState(0);
  const [isOfflineScan, setIsOfflineScan] = useState(false);
  const [isDuplicateScan, setIsDuplicateScan] = useState(false);
  
  // The Automated Schedule State
  const [classStartTime, setClassStartTime] = useState<string | null>(null);
  const [classEndTime, setClassEndTime] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"loading" | "regular" | "override" | "none">("loading");
  const [scheduleNote, setScheduleNote] = useState<string>("");

  useEffect(() => {
    const fetchTodaySchedule = async () => {
      const today = new Date();
      // Format as YYYY-MM-DD
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;
      const dayOfWeek = today.getDay();

      try {
        // 1. Check for Emergency Overrides first
        const { data: exception } = await supabase
          .from("schedule_exceptions")
          .select("*")
          .eq("exception_date", localDateStr)
          .single();

        if (exception) {
          setClassStartTime(exception.new_start_time);
          setClassEndTime(exception.new_end_time);
          setScheduleType("override");
          setScheduleNote(exception.note || "Emergency Override Active");
          return;
        }

        // 2. Fall back to Regular Schedule
        const { data: regular } = await supabase
          .from("weekly_schedule")
          .select("*")
          .eq("day_of_week", dayOfWeek)
          .eq("is_active", true)
          .single();

        if (regular) {
          setClassStartTime(regular.start_time);
          setClassEndTime(regular.end_time);
          setScheduleType("regular");
          setScheduleNote("Running on regular schedule");
          return;
        }

        // 3. No class scheduled today
        setClassStartTime(null);
        setScheduleType("none");
        setScheduleNote("No class today");

      } catch (error) {
        console.error("Error fetching schedule:", error);
        setScheduleType("none");
      }
    };

    fetchTodaySchedule();
  }, []);

  const handleSuccessfulScan = (studentData: any, xp: number, offline: boolean, duplicate: boolean) => {
    setLastScanned(studentData);
    setJustAwardedXp(xp);
    setIsOfflineScan(offline);
    setIsDuplicateScan(duplicate);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8 flex flex-col font-sans">
      
      {/* --- KIOSK HEADER --- */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            IC
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">ICT Cram</h1>
            <p className="text-slate-500 text-sm font-medium">Automated Attendance Check-In</p>
          </div>
        </div>
        
        {/* AUTOMATED SCHEDULE READOUT */}
        <div className={`flex items-center gap-4 p-3 pr-5 rounded-2xl border w-full md:w-auto shadow-sm ${
          scheduleType === 'override' ? 'bg-amber-50 border-amber-200' : 
          scheduleType === 'regular' ? 'bg-blue-50 border-blue-200' : 
          'bg-slate-50 border-slate-200'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
            scheduleType === 'override' ? 'bg-amber-100 text-amber-600' : 
            scheduleType === 'regular' ? 'bg-blue-100 text-blue-600' : 
            'bg-slate-200 text-slate-500'
          }`}>
            {scheduleType === 'override' ? '⚠️' : scheduleType === 'regular' ? '⏱️' : '🗓️'}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {scheduleType === 'loading' ? 'Loading Schedule...' : scheduleNote}
            </p>
            {classStartTime ? (
              <p className="text-lg font-black text-slate-800 font-mono tracking-tight">
                {classStartTime} — {classEndTime || '??:??'}
              </p>
            ) : (
              <p className="text-lg font-bold text-slate-400 tracking-tight">Scanner Offline</p>
            )}
          </div>
        </div>
      </header>

      {/* --- SPLIT SCREEN DASHBOARD --- */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* LEFT: THE SCANNER HARDWARE */}
        <section className="lg:w-5/12 xl:w-1/3 bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-50 to-transparent -z-0"></div>
          
          <div className="relative z-10 w-full">
            <AttendanceScanner classStartTime={classStartTime} onScanSuccess={handleSuccessfulScan} />
          </div>
        </section>

        {/* RIGHT: THE LIVE FEED DISPLAY */}
        <section className="lg:w-7/12 xl:w-2/3 flex flex-col">
          <div className={`rounded-[2.5rem] shadow-sm border p-8 md:p-12 flex-1 flex flex-col relative overflow-hidden transition-all duration-500 ${isDuplicateScan ? 'bg-amber-50 border-amber-200' : lastScanned ? 'bg-white border-blue-100 shadow-[0_10px_40px_rgba(59,130,246,0.05)]' : 'bg-white border-slate-200/60'}`}>
            
            {lastScanned ? (
              <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                
                {/* Profile Avatar */}
                <div className={`w-40 h-40 rounded-full mb-8 shadow-2xl border-8 flex items-center justify-center text-7xl transform transition-transform hover:scale-105 ${isDuplicateScan ? 'bg-amber-100 border-amber-200 text-amber-500' : isOfflineScan ? 'bg-orange-100 border-orange-200 text-orange-500' : 'bg-slate-100 border-white text-slate-400'}`}>
                  {isDuplicateScan ? '🛑' : isOfflineScan ? '📦' : '👤'}
                </div>
                
                <h3 className="text-4xl md:text-5xl font-black text-slate-800 text-center mb-3 tracking-tight">
                  {lastScanned.full_name}
                </h3>
                <p className="text-xl text-slate-500 font-bold tracking-widest uppercase mb-12">
                  {lastScanned.grade_batch}
                </p>

                {/* Status Banners */}
                {isDuplicateScan ? (
                  <div className="bg-white border-2 border-amber-200 p-6 rounded-3xl w-full max-w-md text-center shadow-xl shadow-amber-500/10">
                    <p className="text-xl font-black text-amber-600 uppercase tracking-widest mb-2">Access Logged</p>
                    <p className="text-slate-600 font-medium">You have already been checked in for this session. Please take your seat.</p>
                  </div>
                ) : (
                  <div className={`p-1.5 rounded-[2rem] w-full max-w-md transform transition-all shadow-2xl ${isOfflineScan ? 'bg-slate-200' : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]'}`}>
                    <div className="bg-white rounded-[1.8rem] p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Rank XP</p>
                        <p className={`text-5xl font-black tracking-tighter ${isOfflineScan ? 'text-slate-400' : 'text-orange-500'}`}>
                          {lastScanned.total_xp} {isOfflineScan ? null : <span className="text-3xl ml-1">⭐</span>}
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
                              <p className="text-xs font-bold text-amber-500 mt-2 uppercase tracking-wider">Early Bonus!</p>
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
                <h2 className="text-3xl font-black text-slate-300 tracking-tight mb-4">Welcome to Class</h2>
                <p className="text-slate-400 font-medium text-lg max-w-sm">
                  Please hold your ICMS Student Card up to the camera on the left to check in.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}