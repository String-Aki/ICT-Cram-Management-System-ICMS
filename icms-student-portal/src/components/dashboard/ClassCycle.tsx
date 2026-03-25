"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ClassCycle({ studentId, cycleClasses }: { studentId: string, cycleClasses: number }) {
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openLog = async () => {
    setShowModal(true);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("scanned_at, status")
        .eq("student_id", studentId)
        .order("scanned_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        onClick={openLog}
        className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group relative"
      >
        <div className="absolute top-4 right-4 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          View Log
        </div>
        <div>
          <h2 className="font-black text-slate-800 text-xl flex items-center gap-2 mb-1 group-hover:text-emerald-600 transition-colors">
            <span>🗓️</span> Class Cycle
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-6">Your progress towards the next fee renewal.</p>
        </div>
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Attended</span>
            <span className="text-2xl font-black text-slate-800">{cycleClasses} <span className="text-lg text-slate-400">/ 8</span></span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${Math.min((cycleClasses / 8) * 100, 100)}%` }}>
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            <div className="bg-emerald-50 p-6 border-b border-emerald-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-emerald-900 flex items-center gap-2"><span>📅</span> Attendance Log</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-emerald-200/50 hover:bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div></div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 font-bold text-slate-400">No classes logged yet.</div>
              ) : (
                <div className="space-y-3">
                  {history.map((record, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-xl">✅</div>
                        <div>
                          <p className="font-black text-slate-800">{new Date(record.scanned_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(record.scanned_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded-md">Present</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}