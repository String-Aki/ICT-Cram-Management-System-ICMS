"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import SNT from "@/components/StudentNameTransformer";

// --- THE RANK DICTIONARY ---
const RANKS = [
  {
    id: "rank_1",
    name: "Pixel Pioneer",
    min: 0,
    desc: "Unlocked on first ID scan.",
    color: "from-slate-400 to-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-300",
    text: "text-slate-600",
    icon: "🌱",
  },
  {
    id: "rank_2",
    name: "Circuit Surfer",
    min: 300,
    desc: "Reached 300 XP.",
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    icon: "🌊",
  },
  {
    id: "rank_3",
    name: "Tech Ranger",
    min: 900,
    desc: "Reached 900 XP.",
    color: "from-emerald-400 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    icon: "🛡️",
  },
  {
    id: "rank_4",
    name: "Neon Knight",
    min: 2000,
    desc: "Reached 2,000 XP.",
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-50",
    border: "border-purple-300",
    text: "text-purple-700",
    icon: "⚔️",
  },
  {
    id: "rank_5",
    name: "Digital Legend",
    min: 5000,
    desc: "Reached 5,000 XP.",
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    icon: "👑",
  },
];

// --- THE ACHIEVEMENT DICTIONARY ---
const ACHIEVEMENTS = [
  {
    id: "player_one",
    name: "Player One",
    desc: "First to check in for the day.",
    icon: "🕹️",
    color: "from-amber-400 to-orange-500",
    text: "text-amber-600",
    border: "border-amber-300",
    bg: "bg-amber-50",
  },
  {
    id: "warp_speed",
    name: "Warp Speed",
    desc: "Checked in early 5 classes in a row.",
    icon: "🚀",
    color: "from-purple-500 to-pink-500",
    text: "text-purple-600",
    border: "border-purple-300",
    bg: "bg-purple-50",
  },
  {
    id: "fully_charged",
    name: "Fully Charged",
    desc: "Perfect attendance for 3 months.",
    icon: "🔋",
    color: "from-green-400 to-emerald-500",
    text: "text-emerald-600",
    border: "border-emerald-300",
    bg: "bg-emerald-50",
  },
  {
    id: "glitch_free",
    name: "Glitch-Free",
    desc: "10 classes attended without an absence.",
    icon: "🛡️",
    color: "from-blue-400 to-cyan-500",
    text: "text-blue-600",
    border: "border-blue-300",
    bg: "bg-blue-50",
  },
  {
    id: "brain_blast",
    name: "Brain Blast",
    desc: "Awarded for exceptional performance.",
    icon: "💡",
    color: "from-yellow-300 to-amber-400",
    text: "text-yellow-600",
    border: "border-yellow-300",
    bg: "bg-yellow-50",
  },
];

export default function HallOfFame() {
  const [students, setStudents] = useState<any[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // UI States
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const [printQueue, setPrintQueue] = useState<
    { student: any; item: any; type: "RANK" | "ACHIEVEMENT" }[]
  >([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [studentsRes, badgesRes] = await Promise.all([
      supabase
        .from("students")
        .select("id, full_name, grade_batch, total_xp")
        .eq("is_active", true)
        .order("total_xp", { ascending: false })
        .order("full_name", { ascending: true }),
      supabase.from("student_achievements").select("*"),
    ]);

    if (studentsRes.data) setStudents(studentsRes.data);
    if (badgesRes.data) setUnlockedBadges(badgesRes.data);
    setIsLoading(false);
  };

  const getTotalUnlocksCount = (studentId: string, xp: number) => {
    const badges = unlockedBadges.filter(
      (b) => b.student_id === studentId,
    ).length;
    const ranks = xp > 0 ? RANKS.filter((r) => xp >= r.min).length : 0;
    return badges + ranks;
  };

  const hasBadge = (studentId: string, achievementId: string) => {
    return unlockedBadges.some(
      (b) => b.student_id === studentId && b.achievement_id === achievementId,
    );
  };

  const isRankUnlocked = (xp: number, rankMin: number) => {
    if (xp === 0) return false;
    return xp >= rankMin;
  };

  const togglePrintQueue = (
    student: any,
    item: any,
    type: "RANK" | "ACHIEVEMENT",
  ) => {
    const exists = printQueue.find(
      (q) => q.student.id === student.id && q.item.id === item.id,
    );
    if (exists) {
      setPrintQueue(
        printQueue.filter(
          (q) => !(q.student.id === student.id && q.item.id === item.id),
        ),
      );
    } else {
      setPrintQueue([...printQueue, { student, item, type }]);
    }
  };

  const manuallyAwardBadge = async (
    studentId: string,
    achievementId: string,
  ) => {
    const { error } = await supabase
      .from("student_achievements")
      .insert({ student_id: studentId, achievement_id: achievementId });
    if (!error) fetchData();
  };

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.grade_batch.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex overflow-hidden">
      {/* GLOBAL PRINT STYLES */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `,
        }}
      />

      {/* LAYER 1: THE COLLECTOR's GRID */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto print:hidden">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <span className="text-4xl">⭐</span> Hall of Fame
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              View student trophy cabinets and print achievement stickers.
            </p>
          </div>
          <input
            type="text"
            placeholder="Find a student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 shadow-sm"
          />
        </header>

        {isLoading ? (
          <div className="text-center text-slate-400 font-medium animate-pulse mt-20">
            Loading Cabinets...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
            {filteredStudents.map((student) => {
              const unlockCount = getTotalUnlocksCount(
                student.id,
                student.total_xp,
              );
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-inner border-[4px] border-white ring-4 ring-slate-50">
                    {unlockCount > 0 ? "🏆" : "👤"}
                  </div>
                  <h3 className="font-black text-lg text-slate-800 line-clamp-1 w-full">
                    {SNT(student.full_name)}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">
                    {student.grade_batch}
                  </p>

                  <div
                    className={`px-4 py-2 rounded-full text-sm font-bold w-full transition-colors ${unlockCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {unlockCount} {unlockCount === 1 ? "Sticker" : "Stickers"}{" "}
                    Unlocked
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LAYER 2: THE TROPHY CABINET DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out z-40 print:hidden ${selectedStudent ? "translate-x-0" : "translate-x-full"}`}
      >
        {selectedStudent && (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 line-clamp-1 pr-4">
                  {SNT(selectedStudent.full_name)}
                </h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Trophy Cabinet • {selectedStudent.total_xp} XP
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-10 h-10 shrink-0 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* SECTION 1: RANKS */}
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Progression Ranks
              </h3>
              <div className="space-y-4 mb-8">
                {RANKS.map((rank) => {
                  const unlocked = isRankUnlocked(
                    selectedStudent.total_xp,
                    rank.min,
                  );
                  const isQueued = printQueue.some(
                    (q) =>
                      q.student.id === selectedStudent.id &&
                      q.item.id === rank.id,
                  );

                  return (
                    <div
                      key={rank.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex gap-4 ${unlocked ? `${rank.bg} ${rank.border}` : "bg-slate-50 border-slate-200 grayscale opacity-60"}`}
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-2xl shadow-inner ${unlocked ? "bg-white" : "bg-slate-200"}`}
                      >
                        {rank.icon}
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-black text-lg ${unlocked ? rank.text : "text-slate-600"}`}
                        >
                          {rank.name}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          {rank.desc}
                        </p>

                        {unlocked ? (
                          <button
                            onClick={() =>
                              togglePrintQueue(selectedStudent, rank, "RANK")
                            }
                            className={`mt-3 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all ${isQueued ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white border border-slate-300 text-slate-600 hover:border-blue-400"}`}
                          >
                            {isQueued ? "✓ Queued" : "+ Add to Queue"}
                          </button>
                        ) : (
                          <div className="mt-3 px-3 py-1 bg-slate-200 inline-block text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">
                            Requires {rank.min} XP
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECTION 2: ACHIEVEMENTS */}
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Special Badges
              </h3>
              <div className="space-y-4">
                {ACHIEVEMENTS.map((ach) => {
                  const unlocked = hasBadge(selectedStudent.id, ach.id);
                  const isQueued = printQueue.some(
                    (q) =>
                      q.student.id === selectedStudent.id &&
                      q.item.id === ach.id,
                  );

                  return (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex gap-4 ${unlocked ? `${ach.bg} ${ach.border}` : "bg-slate-50 border-slate-200 grayscale opacity-60"}`}
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-2xl shadow-inner ${unlocked ? "bg-white" : "bg-slate-200"}`}
                      >
                        {ach.icon}
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-black text-lg ${unlocked ? ach.text : "text-slate-600"}`}
                        >
                          {ach.name}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          {ach.desc}
                        </p>

                        {unlocked ? (
                          <button
                            onClick={() =>
                              togglePrintQueue(
                                selectedStudent,
                                ach,
                                "ACHIEVEMENT",
                              )
                            }
                            className={`mt-3 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all ${isQueued ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white border border-slate-300 text-slate-600 hover:border-blue-400"}`}
                          >
                            {isQueued ? "✓ Queued" : "+ Add to Queue"}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              manuallyAwardBadge(selectedStudent.id, ach.id)
                            }
                            className="mt-3 px-3 py-1 bg-slate-200 text-slate-500 text-[10px] uppercase tracking-wider font-bold rounded hover:bg-slate-300 transition-colors"
                          >
                            Award Manually
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BAR FOR PRINTING */}
      {printQueue.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 print:hidden border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖨️</span>
            <div>
              <p className="font-black text-lg leading-tight">
                {printQueue.length} Stickers Ready
              </p>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="flex gap-2">
            <button
              onClick={() => setPrintQueue([])}
              className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform hover:scale-105"
            >
              Print Now
            </button>
          </div>
        </div>
      )}

      {/* THE A4 STICKER CANVAS (Visible ONLY on Print) */}
      <div className="hidden print:block w-[210mm] bg-white absolute top-0 left-0 p-[12mm] pt-[15mm]">
        <div className="grid grid-cols-3 gap-[10mm] content-start">
          {printQueue.map((job, i) => (
            <div
              key={i}
              className="aspect-square flex flex-col items-center justify-center"
            >
              <div
                className={`w-[55mm] h-[55mm] rounded-full border-[6px] ${job.item.border} ${job.item.bg} flex flex-col items-center justify-center relative overflow-hidden shadow-sm`}
              >
                <div
                  className={`absolute -bottom-6 -right-6 text-[80px] opacity-10 select-none ${job.item.text}`}
                >
                  {job.item.icon}
                </div>

                <div className="relative z-10 flex flex-col items-center text-center w-full px-4">
                  <span className="text-4xl mb-1 drop-shadow-sm">
                    {job.item.icon}
                  </span>

                  <p
                    className={`text-[8.5px] font-black uppercase tracking-widest mb-1 ${job.item.text}`}
                  >
                    {job.type}
                  </p>

                  <h2
                    className={`text-lg font-black uppercase tracking-tighter mb-2 leading-tight ${job.item.text}`}
                  >
                    {job.item.name}
                  </h2>

                  <div className="w-10 h-1 bg-slate-200 rounded-full mb-2"></div>
                  <p className="text-sm font-black text-slate-800 leading-tight w-full truncate">
                    {job.student.full_name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
