"use client";

import { useState } from "react";

const formatDescriptionWithLinks = (text: string) => {
  if (!text) return "No description provided for this quest.";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-bold hover:text-indigo-600 underline decoration-indigo-200 underline-offset-4 transition-colors">
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default function QuestHub({ activeQuests }: { activeQuests: any[] }) {
  const [selectedQuest, setSelectedQuest] = useState<any>(null);

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-black text-slate-800 text-xl flex items-center gap-2"><span>📜</span> Quests</h2>
          <div className="bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full">
            {activeQuests.length} Pending
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {activeQuests.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <span className="text-4xl grayscale opacity-40 block mb-3">🎉</span>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">All caught up!</p>
            </div>
          ) : (
            activeQuests.slice(0, 3).map(quest => (
              <div key={quest.id} onClick={() => setSelectedQuest(quest)} className="group bg-white border border-slate-100 shadow-sm p-4 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"></div>
                <div className="flex justify-between items-start mb-2 pl-2">
                  <h3 className="font-bold text-slate-700 group-hover:text-indigo-700 transition-colors line-clamp-1 pr-2">{quest.title}</h3>
                  <span className="shrink-0 bg-amber-100 border border-amber-200 text-amber-700 font-black text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <span>✨</span> +{quest.xp_reward}
                  </span>
                </div>
                {quest.deadline && (
                  <p className="text-xs font-bold text-red-400 flex items-center gap-1.5 pl-2 mt-2">
                    <span>⏳</span> Due {new Date(quest.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      {selectedQuest && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedQuest(null)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-700 font-black text-[10px] px-2 py-1 rounded-md uppercase tracking-widest">Active Quest</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">{selectedQuest.title}</h2>
              </div>
              <button onClick={() => setSelectedQuest(null)} className="w-8 h-8 bg-slate-200 hover:bg-slate-300 text-slate-500 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="prose prose-sm prose-slate max-w-none mb-6">
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{formatDescriptionWithLinks(selectedQuest.description)}</p>
              </div>
              {selectedQuest.resource_url && (
                <a href={selectedQuest.resource_url} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-800/20">
                  <span>🔗</span> Open Attached Resource
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}