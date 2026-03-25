"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};

export default function LeaderboardPage() {
  const router = useRouter();
  
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [gradeBatch, setGradeBatch] = useState<string>("");
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const studentId = localStorage.getItem("icms_active_student");
      if (!studentId) {
        router.replace("/"); 
        return;
      }
      setActiveStudentId(studentId);

      try {
        const { data: me, error: meError } = await supabase
          .from("students")
          .select("grade_batch")
          .eq("id", studentId)
          .single();

        if (meError) throw meError;
        setGradeBatch(me.grade_batch);

        const { data: leaderboardData, error: leaderError } = await supabase
          .from("students")
          .select("id, full_name, total_xp, card_variant")
          .eq("grade_batch", me.grade_batch)
          .eq("is_active", true)
          .order("total_xp", { ascending: false })
          .limit(10);

        if (leaderError) throw leaderError;
        setLeaders(leaderboardData || []);

      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-4 space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs animate-pulse">Entering The Arena...</p>
      </div>
    );
  }

  // --- PODIUM LOGIC (Rearrange Top 3 for visual display: 2nd, 1st, 3rd) ---
  const topThree = leaders.slice(0, 3);
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], rank: 2 }); // Left (2nd)
  if (topThree[0]) podiumOrder.push({ ...topThree[0], rank: 1 }); // Center (1st)
  if (topThree[2]) podiumOrder.push({ ...topThree[2], rank: 3 }); // Right (3rd)
  
  const runnerUps = leaders.slice(3);

  return (
    <div className="min-h-screen bg-[#020617] font-sans selection:bg-indigo-500 selection:text-white pb-24 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 relative z-10">
        
        {/* Header */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors mb-8 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md"
        >
          <span>←</span> Escape Arena
        </Link>
        
        <div className="text-center mb-16 animate-in slide-in-from-top-4 fade-in duration-700">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 tracking-tight drop-shadow-[0_0_15px_rgba(129,140,248,0.3)] mb-2">
            The Arena
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">
            {gradeBatch} Division
          </p>
        </div>

        {leaders.length === 0 ? (
          <div className="text-center p-10 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
            <span className="text-5xl mb-4 block grayscale opacity-50">👻</span>
            <p className="font-bold text-slate-400 uppercase tracking-widest">No challengers yet.</p>
          </div>
        ) : (
          <>
            {/* === THE VISUAL PODIUM (Top 3) === */}
            <div className="flex items-end justify-center gap-2 md:gap-4 mb-16 mt-10 h-64 md:h-72">
              {podiumOrder.map((player) => {
                const isFirst = player.rank === 1;
                const isMe = player.id === activeStudentId;
                
                // Styling dynamically based on rank
                let height = player.rank === 2 ? 'h-[75%]' : player.rank === 3 ? 'h-[65%]' : 'h-full';
                let colors = isFirst 
                  ? 'from-yellow-400 to-amber-600 shadow-[0_0_40px_rgba(251,191,36,0.4)] border-yellow-300' 
                  : player.rank === 2 
                    ? 'from-slate-300 to-slate-500 shadow-[0_0_30px_rgba(148,163,184,0.2)] border-slate-300' 
                    : 'from-orange-400 to-red-600 shadow-[0_0_30px_rgba(234,88,12,0.2)] border-orange-400';
                
                let icon = isFirst ? '👑' : player.rank === 2 ? '🥈' : '🥉';

                return (
                  <div 
                    key={player.id} 
                    className={`relative w-28 md:w-40 flex flex-col items-center justify-end animate-in slide-in-from-bottom-10 fade-in duration-1000 ${height}`}
                    style={{ animationDelay: `${player.rank * 200}ms` }}
                  >
                    {/* The Avatar Bubble */}
                    <div className={`absolute -top-12 z-20 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${colors} p-1 flex items-center justify-center ${isFirst ? 'animate-bounce' : ''}`}>
                      <div className="w-full h-full bg-[#0B1120] rounded-full flex items-center justify-center text-white font-black text-xl md:text-2xl relative">
                        {isMe && <div className="absolute -bottom-2 bg-indigo-600 text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full ring-2 ring-[#0B1120]">You</div>}
                        {getInitials(player.full_name)}
                      </div>
                      <div className="absolute -top-6 text-3xl drop-shadow-lg">{icon}</div>
                    </div>

                    {/* The Podium Pillar */}
                    <div className={`w-full h-full bg-gradient-to-t ${colors} rounded-t-2xl p-[1px] opacity-90 transition-transform hover:scale-105 duration-300 origin-bottom`}>
                      <div className="w-full h-full bg-[#0B1120]/90 rounded-t-2xl backdrop-blur-md flex flex-col items-center justify-start pt-10 md:pt-14 px-2 text-center">
                        <h3 className={`font-black text-xs md:text-sm line-clamp-1 mb-1 ${isFirst ? 'text-yellow-400' : player.rank === 2 ? 'text-slate-300' : 'text-orange-400'}`}>
                          {player.full_name.split(' ')[0]}
                        </h3>
                        <span className="text-lg md:text-2xl font-black text-white">{player.total_xp}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* === THE CONTENDERS LIST (Ranks 4-10) === */}
            <div className="space-y-3 relative z-20">
              {runnerUps.map((player, index) => {
                const rank = index + 4;
                const isMe = player.id === activeStudentId;

                return (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-md transition-all duration-500 animate-in slide-in-from-right-8 fade-in ${
                      isMe 
                        ? 'bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.2)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    style={{ animationDelay: `${(index + 3) * 150}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center text-slate-500 font-black text-lg">
                        #{rank}
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${isMe ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                        {getInitials(player.full_name)}
                      </div>
                      <div>
                        <h3 className={`font-black text-sm md:text-base ${isMe ? 'text-indigo-300' : 'text-slate-200'}`}>
                          {player.full_name} {isMe && <span className="text-[10px] ml-2 bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          Lvl {player.card_variant}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-xl font-black ${isMe ? 'text-indigo-400' : 'text-slate-300'}`}>
                        {player.total_xp}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 ml-1">XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}