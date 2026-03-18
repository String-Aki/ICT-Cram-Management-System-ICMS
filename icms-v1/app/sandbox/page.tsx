"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";

export default function IDSandbox() {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL("ITMS-TEST89", { margin: 0, width: 200 }).then(setQrDataUrl);
  }, []);

  const handleExport = async () => {
    if (cardRef.current === null) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 4 
      });
      
      const link = document.createElement("a");
      link.download = "Clark_Kent_ID.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="p-4 md:p-8 min-h-screen flex flex-col bg-gray-900 text-white items-center">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-400">Tailwind ID Card Sandbox</h1>
        <p className="text-sm text-gray-400 mt-2">Adjust the Tailwind `top-[]` and `left-[]` classes to align your text.</p>
      </header>

      <div 
        ref={cardRef}
        className="relative bg-white overflow-hidden shadow-2xl rounded-sm"
        style={{ width: "324px", height: "204px" }}
      >
        <img 
          src="/id-front.jpg" 
          alt="ID Background" 
          className="absolute inset-0 w-full h-full object-cover z-0" 
        />
        
        <div className="absolute z-10 top-[39px] left-[190px] flex flex-col gap-7">
          <p className="text-sm font-bold text-black m-0 leading-none">Clark Kent</p>
          <p className="text-[11px] font-bold text-gray-700 m-0 leading-none">A Level Physics</p>
        </div>

        <div className="absolute z-10 bottom-[35px] left-[115px]">
           <p className="text-xs tracking-[0.2em] font-mono font-bold text-black m-0 leading-none">
             ITMS-TEST89
           </p>
        </div>

        {qrDataUrl && (
          <div className="absolute z-10 top-[30px] left-[30px] w-[80px] h-[80px] bg-white p-1 rounded">
            <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      <div className="mt-8">
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className={`px-6 py-3 rounded-lg font-bold shadow-lg transition-all ${
            isExporting ? "bg-gray-600 cursor-wait" : "bg-blue-600 hover:bg-blue-500 hover:scale-105"
          }`}
        >
          {isExporting ? "Generating High-Res Image..." : "⬇️ Download Print-Ready PNG"}
        </button>
      </div>

    </main>
  );
}