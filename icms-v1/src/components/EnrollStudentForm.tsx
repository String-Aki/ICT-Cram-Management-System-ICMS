"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { League_Spartan, Prata } from "next/font/google";
import SNT from "@/components/StudentNameTransformer";

const leagueSpartan = League_Spartan({ subsets: ["latin"], weight: ["400", "700", "800"] });
const prata = Prata({ subsets: ["latin"], weight: ["400"] });

interface EnrolledStudent {
  fullName: string;
  gradeBatch: string;
  shortId: string;
  variant: number;
  pin: string;
}

const getMonthLetters = (dateStr: string) => {
  const date = new Date(dateStr);
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const monthName = months[date.getMonth()];
  return `${monthName.charAt(0)}${monthName.charAt(monthName.length - 1)}`;
};

const getSequenceString = (existingCount: number) => {
  if (existingCount < 99) {
    return (existingCount + 1).toString().padStart(2, '0');
  } else {
    const overflow = existingCount - 99;
    const numberPrefix = Math.floor(overflow / 26) + 1;
    const letterSuffix = String.fromCharCode(65 + (overflow % 26));
    return `${numberPrefix}${letterSuffix}`;
  }
};

export default function EnrollStudentForm() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [gradeBatch, setGradeBatch] = useState("");
  const [medium, setMedium] = useState<"E" | "T">("E");

  const getTodayString = () => new Date().toISOString().split("T")[0];
  const [enrollDate, setEnrollDate] = useState(getTodayString());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [newStudent, setNewStudent] = useState<EnrolledStudent | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const generatedPin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    try {
      const dayStr = enrollDate.split("-")[2];
      const monthLetters = getMonthLetters(enrollDate);
      const dateCode = `${dayStr}${monthLetters}`;
      const idPrefix = `ICMS-${medium}-${dateCode}`;
      
      const { count, error: countError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      const sequence = getSequenceString(count || 0);
      const finalShortId = `${idPrefix}${sequence}`;
      const rolledVariant = Math.floor(Math.random() * 6) + 1; 

      const { data: studentData, error: insertError } = await supabase
        .from("students")
        .insert([{
            full_name: fullName,
            grade_batch: gradeBatch,
            qr_code: finalShortId,
            card_variant: rolledVariant,
            enrollment_date: enrollDate,
            pin_code: generatedPin,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      if (studentData) {
        const { error: queueError } = await supabase
          .from("card_print_queue")
          .insert([{ student_id: studentData.id }]);
        
        if (queueError) console.error("Failed to queue card:", queueError);
      }

      const qrImage = await QRCode.toDataURL(finalShortId, { margin: 0, width: 200 });
      setQrDataUrl(qrImage);

      setNewStudent({
        fullName,
        gradeBatch,
        shortId: finalShortId,
        variant: rolledVariant,
        pin: generatedPin,
      });

      setFullName("");
      setGradeBatch("");
      router.refresh();

    } catch (error: any) {
      console.error(error);
      setErrorMsg(`❌ Error: ${error?.message || "Failed to enroll student. Ensure database is connected."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closePrintRoom = () => {
    setNewStudent(null);
    setQrDataUrl("");
  };

  return (
    <>
      {newStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 overflow-y-auto">

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-5xl w-full border border-slate-200 my-4">
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-100 mb-2 md:mb-4">
                <span className="text-2xl md:text-3xl">🎉</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Student Enrolled!</h2>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 w-full max-w-lg flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 shadow-sm">
              <div className="text-center sm:text-left">
                <p className="text-sm text-blue-700 font-bold uppercase tracking-wider">App Login PIN</p>
                <p className="text-xs text-slate-500 mt-1">Temporary password for their first login.</p>
              </div>
              <div className="bg-white px-5 py-2 rounded-lg border border-blue-200 shadow-inner">
                <p className="text-3xl font-mono font-bold text-slate-800 tracking-[0.15em] m-0">{newStudent.pin}</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-center mb-8">
              
              {/* --- FRONT CARD --- */}
              <div className="flex flex-col items-center gap-3">
                <span className="text-slate-400 font-bold tracking-widest text-sm">FRONT PREVIEW</span>
                <div className="relative bg-white overflow-hidden shadow-xl rounded-sm" style={{ width: "324px", height: "204px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/id-front.jpg" alt="Front" className="absolute inset-0 w-full h-full object-cover z-0" />
                  
                  <div className="absolute z-10 top-[42px] left-[190px] w-[110px]">
                    <p className={`text-[13px] text-black m-0 leading-[1.15] font-extrabold tracking-tight break-words ${leagueSpartan.className}`}>
                      {SNT(newStudent.fullName)}
                    </p>
                  </div>

                  <div className="absolute z-10 top-[80px] left-[190px]">
                    <p className={`text-sm text-black m-0 leading-none font-extrabold tracking-tight ${leagueSpartan.className}`}>
                      {newStudent.gradeBatch}
                    </p>
                  </div>

                  <div className="absolute z-10 bottom-[35px] left-[95px]">
                     <p className={`text-sm tracking-[0.13em] text-black m-0 leading-none ${prata.className}`}>
                       {newStudent.shortId}
                     </p>
                  </div>

                  {qrDataUrl && (
                    <div className="absolute z-10 top-[30px] left-[30px] w-[80px] h-[80px] bg-white p-1 rounded">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* --- BACK CARD --- */}
              <div className="flex flex-col items-center gap-3">
                <span className="text-yellow-600 font-bold tracking-widest text-sm">BACK PREVIEW (Variant {newStudent.variant})</span>
                <div className="relative bg-white overflow-hidden shadow-xl rounded-sm" style={{ width: "324px", height: "204px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/id-back-${newStudent.variant}.jpg`} alt="Back" className="absolute inset-0 w-full h-full object-cover z-0" />
                </div>
              </div>

            </div>

            {/* Modal Action Buttons */}
            <div className="flex w-full justify-center max-w-md">
              <button 
                onClick={closePrintRoom}
                className="w-full py-4 px-6 font-black text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all shadow-lg hover:-translate-y-1"
              >
                Done & Next Student
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- THE ADMISSION DESK FORM --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">New Admission</h2>
        
        <form onSubmit={handleEnrollment} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Class Medium</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button type="button" onClick={() => setMedium("E")} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${medium === "E" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>English</button>
              <button type="button" onClick={() => setMedium("T")} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${medium === "T" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Tamil</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Enrollment</label>
            <div className="flex gap-2">
              <input type="date" required className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value={enrollDate} onChange={(e) => setEnrollDate(e.target.value)} />
              <button type="button" onClick={() => setEnrollDate(getTodayString())} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200 text-sm">Today</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input type="text" required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Bruce Wayne" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Grade / Batch</label>
            <input type="text" required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="e.g. 10" value={gradeBatch} onChange={(e) => setGradeBatch(e.target.value)} />
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full p-3 text-white font-bold rounded-lg transition-all mt-2 ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"}`}>
            {isSubmitting ? "Enrolling..." : "Enroll Student"}
          </button>
        </form>

        {errorMsg && <div className="mt-4 p-3 rounded-lg text-sm text-center bg-red-50 text-red-700 border border-red-100">{errorMsg}</div>}
      </div>
    </>
  );
}