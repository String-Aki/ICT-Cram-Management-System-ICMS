"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function StudentDashboard() {
  const router = useRouter();
  
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      // 1. Check if they are actually logged in
      const activeStudentId = localStorage.getItem("icms_active_student");
      if (!activeStudentId) {
        router.replace("/"); // Kick them back to login if no ID is found
        return;
      }

      // 2. Fetch their core stats from Supabase
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id, full_name, qr_code, total_xp, card_variant, cycle_classes")
          .eq("id", activeStudentId)
          .single();

        if (error) throw error;
        setStudent(data);
      } catch (error) {
        console.error("Error fetching student:", error);
        // Optional: clear local storage and kick to login if data fetch completely fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("icms_active_student");
    router.push("/");
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-500 font-bold animate-pulse">Loading Player Data...</p>
      </div>
    );
  }

  // Safety Catch
  if (!student) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20"> {/* pb-20 gives space for future mobile nav bars */}
      
      {/* --- TOP NAVIGATION BAR (Mobile First) --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-4 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Welcome back,</p>
          <h1 className="text-xl font-black text-slate-800 line-clamp-1">{student.full_name}</h1>
        </div>
        <button 
          onClick={handleSignOut}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-xl text-sm transition-colors shrink-0"
        >
          Lock
        </button>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      {/* Default padding for mobile, max-w-4xl centers it on desktop */}
      <main className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

        {/* 1. HERO STATS CARD */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-indigo-300 font-bold text-sm uppercase tracking-widest mb-1">Player Status</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">{student.total_xp}</span>
                <span className="text-xl font-bold text-indigo-200">XP</span>
              </div>
              <p className="text-slate-400 font-medium mt-2 text-sm">
                ID: <span className="text-slate-200 font-mono">{student.qr_code}</span>
              </p>
            </div>

            {/* Placeholder for Card Variant Graphic */}
            <div className="w-full md:w-32 h-32 bg-white/10 border-2 border-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <div className="text-center">
                <p className="text-3xl mb-1">🛡️</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Lvl {student.card_variant}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. GRID FOR FUNCTIONAL MODULES */}
        {/* 1 col on mobile, 2 cols on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Quest Hub Stub */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-black text-slate-800 text-lg mb-1">Active Quests</h2>
            <p className="text-sm text-slate-500 mb-4">You have pending homework.</p>
            <button className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-colors">
              View Quests →
            </button>
          </div>

          {/* Attendance/Cycle Stub */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-black text-slate-800 text-lg mb-1">Class Cycle</h2>
            <p className="text-sm text-slate-500 mb-4">Tracking towards fee renewal.</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                {/* Dynamically fill the bar based on cycle_classes (assuming 8 is max) */}
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${(student.cycle_classes / 8) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-black text-slate-700">{student.cycle_classes} / 8</span>
            </div>
          </div>

          {/* Leaderboard Stub */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-black text-slate-800 text-lg">The Arena</h2>
                <p className="text-sm text-slate-500">See where you rank.</p>
              </div>
              <span className="text-3xl">🏆</span>
            </div>
            <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">
              Open Leaderboard
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}