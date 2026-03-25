"use client";

export default function HeroStats({ totalXp, cardVariant, qrCode }: { totalXp: number, cardVariant: number, qrCode: string }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-[#0B1120] rounded-[2rem] p-6 md:p-8 text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden border border-slate-800">
      <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></span>
            <p className="text-indigo-300 font-black text-[10px] uppercase tracking-[0.2em]">Player Status Online</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black tracking-tighter drop-shadow-md">{totalXp}</span>
            <span className="text-2xl font-bold text-indigo-400">XP</span>
          </div>
          <p className="text-slate-400 font-medium mt-3 text-sm flex items-center gap-2">
            <span className="opacity-50">ID:</span> <span className="text-slate-200 font-mono bg-white/10 px-2 py-1 rounded-md">{qrCode}</span>
          </p>
        </div>

        <div className="w-full md:w-32 h-32 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-3xl flex items-center justify-center shrink-0 shadow-inner">
          <div className="text-center transform transition-transform hover:scale-110 duration-300">
            <p className="text-4xl mb-2 drop-shadow-lg">🛡️</p>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Lvl {cardVariant}</p>
          </div>
        </div>
      </div>
    </div>
  );
}