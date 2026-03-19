"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ScheduleManager() {
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  
  // Base Routine Form States
  const [selectedDay, setSelectedDay] = useState("5"); 
  const [baseTime, setBaseTime] = useState("14:30");
  const [baseEndTime, setBaseEndTime] = useState("16:30");
  
  // Exception Form States
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionTime, setExceptionTime] = useState("");
  const [exceptionEndTime, setExceptionEndTime] = useState("");
  const [exceptionNote, setExceptionNote] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setIsLoading(true);
    const [weeklyRes, exceptionRes] = await Promise.all([
      supabase.from("weekly_schedule").select("*").order("day_of_week"),
      supabase.from("schedule_exceptions").select("*").order("exception_date", { ascending: true })
    ]);
    
    if (weeklyRes.data) setWeeklySchedule(weeklyRes.data);
    if (exceptionRes.data) setExceptions(exceptionRes.data);
    setIsLoading(false);
  };

  const handleSaveBaseTime = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("weekly_schedule").upsert(
      { 
        day_of_week: parseInt(selectedDay), 
        start_time: baseTime, 
        end_time: baseEndTime,
        is_active: true 
      },
      { onConflict: 'day_of_week' }
    );
    if (!error) fetchSchedules();
  };

  const handleDeleteBase = async (id: string) => {
    await supabase.from("weekly_schedule").delete().eq("id", id);
    fetchSchedules();
  };

  const handleSaveException = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("schedule_exceptions").insert([{
      exception_date: exceptionDate,
      new_start_time: exceptionTime,
      new_end_time: exceptionEndTime,
      note: exceptionNote || "Rescheduled"
    }]);
    if (!error) {
      setExceptionDate(""); setExceptionTime(""); setExceptionEndTime(""); setExceptionNote("");
      fetchSchedules();
    }
  };

  const handleDeleteException = async (id: string) => {
    await supabase.from("schedule_exceptions").delete().eq("id", id);
    fetchSchedules();
  };

  return (
    <main className="p-4 md:p-8 min-h-screen bg-slate-50">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Class Schedule Manager</h1>
        <p className="text-slate-500 mt-1">Configure your base timetable and manage emergency reschedules.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* --- LEFT: THE BASE TIMETABLE --- */}
        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">📅 The Regular Routine</h2>
            <p className="text-sm text-slate-500 mt-1">Set the default times for your regular class days.</p>
          </div>

          <form onSubmit={handleSaveBaseTime} className="flex flex-col sm:flex-row gap-3 mb-8 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Day</label>
              <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white">
                {DAYS_OF_WEEK.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start</label>
              <input type="time" required value={baseTime} onChange={(e) => setBaseTime(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white font-mono" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End</label>
              <input type="time" required value={baseEndTime} onChange={(e) => setBaseEndTime(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white font-mono" />
            </div>
            <button type="submit" className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors">
              Save
            </button>
          </form>

          <div className="space-y-3">
            {isLoading ? <p className="text-slate-400 text-sm">Loading...</p> : weeklySchedule.length === 0 ? <p className="text-slate-400 text-sm italic">No regular classes configured yet.</p> : null}
            {weeklySchedule.map((schedule) => (
              <div key={schedule.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm">
                    {DAYS_OF_WEEK[schedule.day_of_week].substring(0, 3)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">Every {DAYS_OF_WEEK[schedule.day_of_week]}</p>
                    <p className="text-slate-500 font-mono text-sm bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">
                      {schedule.start_time} — {schedule.end_time || '16:30'}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDeleteBase(schedule.id)} className="text-red-400 hover:text-red-600 p-2 text-xl">×</button>
              </div>
            ))}
          </div>
        </section>

        {/* --- RIGHT: THE ONE-TIME OVERRIDES --- */}
        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-amber-600 flex items-center gap-2">⚠️ Emergency Reschedules</h2>
            <p className="text-sm text-slate-500 mt-1">Override the regular routine for a specific date.</p>
          </div>

          <form onSubmit={handleSaveException} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 bg-amber-50 p-4 rounded-xl border border-amber-100">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Date</label>
              <input type="date" required value={exceptionDate} onChange={(e) => setExceptionDate(e.target.value)} className="w-full p-2.5 border border-amber-200 rounded-lg outline-none bg-white" />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-amber-700 uppercase mb-1">New Start</label>
              <input type="time" required value={exceptionTime} onChange={(e) => setExceptionTime(e.target.value)} className="w-full p-2.5 border border-amber-200 rounded-lg outline-none bg-white font-mono" />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-amber-700 uppercase mb-1">New End</label>
              <input type="time" required value={exceptionEndTime} onChange={(e) => setExceptionEndTime(e.target.value)} className="w-full p-2.5 border border-amber-200 rounded-lg outline-none bg-white font-mono" />
            </div>
            <div className="sm:col-span-3 flex flex-col sm:flex-row gap-3 items-end mt-2">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Reason (Optional)</label>
                <input type="text" placeholder="e.g., Heavy rain delay" value={exceptionNote} onChange={(e) => setExceptionNote(e.target.value)} className="w-full p-2.5 border border-amber-200 rounded-lg outline-none bg-white" />
              </div>
              <button type="submit" className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap">
                Override Day
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {isLoading ? <p className="text-slate-400 text-sm">Loading...</p> : exceptions.length === 0 ? <p className="text-slate-400 text-sm italic">No active overrides. Running on normal schedule.</p> : null}
            {exceptions.map((exc) => (
              <div key={exc.id} className="flex justify-between items-center p-4 rounded-xl border border-amber-200 bg-amber-50/30 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400"></div>
                <div className="ml-2">
                  <p className="font-bold text-slate-800">{new Date(exc.exception_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                    <span className="text-amber-700 font-mono font-bold bg-amber-100 px-2 py-0.5 rounded text-sm whitespace-nowrap">
                      {exc.new_start_time} — {exc.new_end_time || '16:30'}
                    </span>
                    <span className="text-slate-500 text-sm italic line-clamp-1">— {exc.note}</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteException(exc.id)} className="text-red-400 hover:text-red-600 p-2 text-xl">×</button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}