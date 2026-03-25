"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // <-- ADDED THIS
import { supabase } from "@/lib/supabase";

const formatDescriptionWithLinks = (text: string) => {
  if (!text) return "No description provided for this quest.";
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-indigo-500 font-bold hover:text-indigo-600 underline decoration-indigo-200 underline-offset-4 transition-colors"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default function StudentDashboard() {
  const router = useRouter();
  
  const [student, setStudent] = useState<any>(null);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedQuest, setSelectedQuest] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const activeStudentId = localStorage.getItem("icms_active_student");
      if (!activeStudentId) {
        router.replace("/"); 
        return;
      }

      try {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, full_name, qr_code, total_xp, card_variant, cycle_classes, grade_batch")
          .eq("id", activeStudentId)
          .single();

        if (studentError) throw studentError;
        setStudent(studentData);

        const { data: materials, error: matError } = await supabase
          .from("class_materials")
          .select("*")
          .eq("grade_batch", studentData.grade_batch)
          .eq("type", "homework")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (matError) throw matError;

        const { data: submissions, error: subError } = await supabase
          .from("homework_submissions")
          .select("material_id")
          .eq("student_id", studentData.id);

        if (subError) throw subError;

        const completedIds = new Set(submissions?.map(s => s.material_id) || []);
        const pendingQuests = materials?.filter(m => !completedIds.has(m.id)) || [];

        setActiveQuests(pendingQuests);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("icms_active_student");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Player Data...</p>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Welcome back</p>
          <h1 className="text-xl font-black text-slate-800 line-clamp-1">{student.full_name}</h1>
        </div>
        <button 
          onClick={handleSignOut}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shrink-0 flex items-center gap-2"
        >
          <span>🚪</span> Lock
        </button>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 relative z-10">

        {/* 1. HERO STATS CARD (The Gamer Banner) */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0B1120] rounded-[2rem] p-6 md:p-8 text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden border border-slate-800">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></span>
                <p className="text-indigo-300 font-black text-[10px] uppercase tracking-[0.2em]">Player Status Online</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black tracking-tighter drop-shadow-md">{student.total_xp}</span>
                <span className="text-2xl font-bold text-indigo-400">XP</span>
              </div>
              <p className="text-slate-400 font-medium mt-3 text-sm flex items-center gap-2">
                <span className="opacity-50">ID:</span> <span className="text-slate-200 font-mono bg-white/10 px-2 py-1 rounded-md">{student.qr_code}</span>
              </p>
            </div>

            <div className="w-full md:w-32 h-32 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-3xl flex items-center justify-center shrink-0 shadow-inner">
              <div className="text-center transform transition-transform hover:scale-110 duration-300">
                <p className="text-4xl mb-2 drop-shadow-lg">🛡️</p>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Lvl {student.card_variant}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. GRID FOR FUNCTIONAL MODULES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* === THE QUEST HUB === */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="font-black text-slate-800 text-xl flex items-center gap-2">
                  <span>📜</span> Quests
                </h2>
              </div>
              <div className="bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                {activeQuests.length} Pending
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {activeQuests.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <span className="text-4xl grayscale opacity-40 block mb-3">🎉</span>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">All caught up!</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">Wait for new drops.</p>
                </div>
              ) : (
                activeQuests.slice(0, 3).map(quest => (
                  <div 
                    key={quest.id} 
                    onClick={() => setSelectedQuest(quest)}
                    className="group bg-white border border-slate-100 shadow-sm p-4 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"></div>
                    
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <h3 className="font-bold text-slate-700 group-hover:text-indigo-700 transition-colors line-clamp-1 pr-2">{quest.title}</h3>
                      <span className="shrink-0 bg-amber-100 border border-amber-200 text-amber-700 font-black text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <span>✨</span> +{quest.xp_reward}
                      </span>
                    </div>
                    {quest.deadline && (
                      <p className="text-xs font-bold text-red-400 flex items-center gap-1.5 pl-2 mt-2">
                        <span>⏳</span> Due {new Date(quest.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {activeQuests.length > 3 && (
              <button className="w-full mt-4 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-xl transition-colors text-xs uppercase tracking-widest">
                View All {activeQuests.length} Quests
              </button>
            )}
          </div>

          {/* === ATTENDANCE / CYCLE TRACKER === */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="font-black text-slate-800 text-xl flex items-center gap-2 mb-1">
                <span>🗓️</span> Class Cycle
              </h2>
              <p className="text-sm font-medium text-slate-500 mb-6">Your progress towards the next fee renewal.</p>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Classes Attended</span>
                <span className="text-2xl font-black text-slate-800">{student.cycle_classes} <span className="text-lg text-slate-400">/ 8</span></span>
              </div>
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out relative" 
                  style={{ width: `${Math.min((student.cycle_classes / 8) * 100, 100)}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* === THE ARENA (LEADERBOARD BUTTON) - ADDED HERE === */}
          <div className="md:col-span-2 bg-gradient-to-r from-[#0B1120] to-slate-900 rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden group border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none transition-transform group-hover:scale-150 duration-700"></div>
            
            <div className="relative z-10 text-center md:text-left">
              <h2 className="font-black text-white text-2xl md:text-3xl flex items-center justify-center md:justify-start gap-3 mb-1">
                <span className="text-4xl">🏆</span> The Arena
              </h2>
              <p className="text-sm font-medium text-slate-400">Compete against your batchmates for the top spot.</p>
            </div>

            <Link 
              href="/dashboard/leaderboard"
              className="relative z-10 w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all flex items-center justify-center gap-2 group-hover:scale-105 duration-300"
            >
              Enter Leaderboard <span>→</span>
            </Link>
          </div>

        </div>
      </main>

      {/* === QUEST DETAILS MODAL === */}
      {selectedQuest && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedQuest(null)}
          ></div>
          
          {/* Modal Card */}
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-700 font-black text-[10px] px-2 py-1 rounded-md uppercase tracking-widest">
                    Active Quest
                  </span>
                  <span className="bg-amber-100 text-amber-700 font-black text-[10px] px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-widest">
                    <span>✨</span> +{selectedQuest.xp_reward} XP
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">{selectedQuest.title}</h2>
              </div>
              
              <button 
                onClick={() => setSelectedQuest(null)}
                className="w-8 h-8 bg-slate-200 hover:bg-slate-300 text-slate-500 rounded-full flex items-center justify-center transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              
              {selectedQuest.deadline && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Deadline</p>
                    <p className="text-sm font-black text-red-700">
                      {new Date(selectedQuest.deadline).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}

              <div className="prose prose-sm prose-slate max-w-none mb-6">
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {formatDescriptionWithLinks(selectedQuest.description)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-8">
                {selectedQuest.resource_url && (
                  <a 
                    href={selectedQuest.resource_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-800/20"
                  >
                    <span>🔗</span> Open Attached Resource
                  </a>
                )}
                
                <p className="text-center text-xs font-medium text-slate-400 mt-4 px-4">
                  Complete this quest in the physical academy to earn your XP!
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}