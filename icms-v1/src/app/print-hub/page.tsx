"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
import SNT from "@/components/StudentNameTransformer";
import { League_Spartan, Prata } from "next/font/google";

const leagueSpartan = League_Spartan({ subsets: ["latin"], weight: ["400", "700", "800"] });
const prata = Prata({ subsets: ["latin"], weight: ["400"] });

export default function PrintHub() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("card_print_queue")
      .select(`
        id,
        student:student_id ( id, full_name, grade_batch, qr_code, card_variant )
      `)
      .eq("status", "pending")
      .order("added_at", { ascending: true });

    if (data) {
      const queueWithQRs = await Promise.all(
        data.map(async (item: any) => {
          const qrDataUrl = await QRCode.toDataURL(item.student.qr_code, { margin: 0, width: 200 });
          return { ...item, qrDataUrl };
        })
      );
      setQueue(queueWithQRs);
    }
    setIsLoading(false);
  };

  const markAsPrinted = async () => {
    const ids = queue.map(item => item.id);
    await supabase.from("card_print_queue").update({ status: "printed" }).in("id", ids);
    fetchQueue();
  };

  const CHUNK_SIZE = 8;
  const pages = [];
  for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
    pages.push(queue.slice(i, i + CHUNK_SIZE));
  }

  const getMirroredBackPage = (chunk: any[]) => {
    const padded = [...chunk];
    while (padded.length % 2 !== 0) {
      padded.push(null);
    }
    const mirrored = [];
    for (let i = 0; i < padded.length; i += 2) {
      mirrored.push(padded[i + 1]);
      mirrored.push(padded[i]);
    }
    return mirrored;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print-hidden { display: none !important; }
          .page-break { page-break-after: always; }
        }
      `}} />

      {/* --- DASHBOARD UI --- */}
      <div className="print-hidden max-w-4xl mx-auto p-8 mb-12">
        <header className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">🖨️ ID Print Hub</h1>
            <p className="text-slate-500 mt-2 font-medium">Batch and align ID cards for professional duplex printing.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchQueue} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50">
              Refresh
            </button>
            <button 
              onClick={() => window.print()} 
              disabled={queue.length === 0}
              className="px-6 py-2 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-500 shadow-md disabled:opacity-50"
            >
              Print Queue ({queue.length})
            </button>
            <button 
              onClick={markAsPrinted} 
              disabled={queue.length === 0}
              className="px-6 py-2 bg-emerald-600 text-white font-black rounded-lg hover:bg-emerald-500 shadow-md disabled:opacity-50"
            >
              Mark as Printed
            </button>
          </div>
        </header>

        {isLoading ? (
          <p className="text-slate-400 font-bold text-center animate-pulse">Loading Queue...</p>
        ) : queue.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <p className="text-slate-400 font-bold text-lg">Queue is empty.</p>
          </div>
        ) : (
          <p className="text-slate-600 font-bold bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
            Generating {pages.length * 2} A4 pages. Make sure "Headers and Footers" are unchecked in your print dialog!
          </p>
        )}
      </div>

      {/* --- THE A4 CANVAS ENGINE --- */}
      <div className="hidden print:block bg-white w-[210mm] mx-auto">
        {pages.map((chunk, pageIndex) => {
          const mirroredBacks = getMirroredBackPage(chunk);

          return (
            <div key={pageIndex}>
              
              {/* PAGE A: FRONTS */}
              <div className="page-break w-[210mm] h-[297mm] pt-[15mm] flex justify-center">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 324px)", gap: "10px", alignContent: "start" }}>
                  {chunk.map((item, i) => (
                    <div key={`front-${i}`} style={{ width: "324px", height: "204px", position: "relative", overflow: "hidden", border: "1px dashed #94a3b8" }}>
                      
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/id-front.jpg" alt="Front" style={{ position: "absolute", top: 0, left: 0, width: "324px", height: "204px", zIndex: 0, objectFit: "cover" }} />
                      
                      <div style={{ position: "absolute", zIndex: 10, top: "42px", left: "190px", width: "110px" }}>
                        <p className={`text-[13px] text-black m-0 leading-[1.15] font-extrabold tracking-tight break-words ${leagueSpartan.className}`}>
                          {SNT(item.student.full_name)}
                        </p>
                      </div>

                      <div style={{ position: "absolute", zIndex: 10, top: "80px", left: "190px" }}>
                        <p className={`text-sm text-black m-0 leading-none font-extrabold tracking-tight ${leagueSpartan.className}`}>
                          {item.student.grade_batch}
                        </p>
                      </div>

                      <div style={{ position: "absolute", zIndex: 10, bottom: "35px", left: "95px" }}>
                        <p className={`text-sm text-black m-0 leading-none ${prata.className}`} style={{ letterSpacing: "0.13em" }}>
                          {item.student.qr_code}
                        </p>
                      </div>

                      {item.qrDataUrl && (
                        <div style={{ position: "absolute", zIndex: 10, top: "30px", left: "30px", width: "80px", height: "80px", backgroundColor: "white", padding: "4px", borderRadius: "4px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.qrDataUrl} alt="QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* PAGE B: BACKS (Mirrored) */}
              <div className="page-break w-[210mm] h-[297mm] pt-[15mm] flex justify-center">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 324px)", gap: "10px", alignContent: "start" }}>
                  {mirroredBacks.map((item, i) => (
                    <div key={`back-${i}`} style={{ width: "324px", height: "204px", position: "relative", overflow: "hidden" }}>
                      {item ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={`/id-back-${item.student.card_variant}.jpg`} alt="Back" style={{ position: "absolute", top: 0, left: 0, width: "324px", height: "204px", zIndex: 0, objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "324px", height: "204px" }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}