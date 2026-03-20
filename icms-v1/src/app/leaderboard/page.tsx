"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import SNT from "@/components/StudentNameTransformer";

// --- The Rank Engine Math ---
const RANKS = [
  { name: "Pixel Pioneer", min: 0, max: 299, color: "from-slate-400 to-slate-500", bg: "bg-slate-100", text: "text-slate-600", icon: "🌱" },
  { name: "Circuit Surfer", min: 300, max: 899, color: "from-blue-400 to-blue-600", bg: "bg-blue-50", text: "text-blue-700", icon: "🌊" },
  { name: "Tech Ranger", min: 900, max: 1999, color: "from-emerald-400 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-700", icon: "🛡️" },
  { name: "Neon Knight", min: 2000, max: 4999, color: "from-purple-500 to-pink-500", bg: "bg-purple-50", text: "text-purple-700", icon: "⚔️" },
  { name: "Digital Legend", min: 5000, max: 99999, color: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-700", icon: "👑" }
];

const getRankDetails = (xp: number) => {
  const currentRank = RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0];
  const nextRank = RANKS[RANKS.indexOf(currentRank) + 1] || currentRank;
  
  // Calculate progress percentage to the next rank
  let progress = 100;
  let xpNeeded = 0;
  if (currentRank !== nextRank) {
    const range = currentRank.max - currentRank.min;
    const xpIntoRank = xp - currentRank.min;
    progress = Math.min(100, Math.max(0, (xpIntoRank / range) * 100));
    xpNeeded = (currentRank.max + 1) - xp;
  }

  return { currentRank, nextRank, progress, xpNeeded };
};

export default function GamificationHub() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("id, full_name, grade_batch, total_xp")
      .order("total_xp", { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard:", error);
    } else {
      setStudents(data || []);
    }
    setIsLoading(false);
  };

  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.grade_batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="text-4xl">🏆</span> Leaderboard
          </h1>
          <p className="text-slate-500 font-medium mt-2">Track student progression, ranks, and XP leaderboards.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search students or batch..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
          />
        </div>
      </header>

      {/* THE PODIUM (Top 3) */}
      {!isLoading && filteredStudents.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-3 gap-4 mb-8 items-end max-w-4xl mx-auto">
          {/* 2nd Place */}
          <div className="bg-white rounded-t-3xl border border-slate-200 shadow-sm p-4 text-center transform translate-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner border-4 border-slate-200">🥈</div>
            <p className="font-bold text-slate-800 line-clamp-1">{filteredStudents[1].full_name}</p>
            <p className="text-sm font-black text-blue-600 mt-1">{filteredStudents[1].total_xp} XP</p>
            <div className="w-full h-32 bg-slate-200 rounded-t-xl mt-4 opacity-50"></div>
          </div>
          {/* 1st Place */}
          <div className="bg-linear-to-b from-amber-100 to-white rounded-t-3xl border border-amber-200 shadow-lg p-6 text-center z-10 flex flex-col items-center relative">
            <div className="absolute -top-6 text-4xl animate-bounce">👑</div>
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl mb-3 shadow-inner border-4 border-amber-300">🥇</div>
            <p className="font-black text-lg text-slate-800 line-clamp-1">{filteredStudents[0].full_name}</p>
            <p className="text-lg font-black text-orange-600 mt-1">{filteredStudents[0].total_xp} XP</p>
            <div className="w-full h-40 bg-amber-300 rounded-t-xl mt-4 opacity-70"></div>
          </div>
          {/* 3rd Place */}
          <div className="bg-white rounded-t-3xl border border-slate-200 shadow-sm p-4 text-center transform translate-y-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner border-4 border-orange-200">🥉</div>
            <p className="font-bold text-slate-800 line-clamp-1">{filteredStudents[2].full_name}</p>
            <p className="text-sm font-black text-blue-600 mt-1">{filteredStudents[2].total_xp} XP</p>
            <div className="w-full h-24 bg-orange-200 rounded-t-xl mt-4 opacity-50"></div>
          </div>
        </div>
      )}

      {/* THE MAIN LEADERBOARD */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Loading Leaderboard...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold w-16 text-center">#</th>
                  <th className="p-4 font-bold">Student</th>
                  <th className="p-4 font-bold">Current Rank</th>
                  <th className="p-4 font-bold w-1/3 min-w-50">Next Rank Progress</th>
                  <th className="p-4 font-bold text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, index) => {
                  const { currentRank, nextRank, progress, xpNeeded } = getRankDetails(student.total_xp);
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-center font-bold text-slate-400 group-hover:text-slate-600">
                        {index + 1}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 text-lg">{SNT(student.full_name)}</p>
                        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-0.5">{student.grade_batch}</p>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${currentRank.bg} ${currentRank.text} border-current/20`}>
                          <span className="text-lg">{currentRank.icon}</span>
                          <span className="text-sm font-black tracking-wide uppercase">{currentRank.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {currentRank === nextRank ? (
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Max Level Reached</span>
                        ) : (
                          <div className="w-full">
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-slate-400">{xpNeeded} XP to {nextRank.name}</span>
                              <span className="text-slate-600">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full bg-linear-to-r ${currentRank.color} rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-2xl font-black text-slate-800 font-mono tracking-tighter">
                          {student.total_xp}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}