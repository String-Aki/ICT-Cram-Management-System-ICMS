"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CalendarDays, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

type Schedule = {
  id: string; title: string; schedule_type: string; parent_schedule_id: string | null;
  override_action: string | null; day_of_week: number | null; specific_date: string | null;
  start_time: string | null; end_time: string | null; target_grades: string[]; target_students: string[];
};

export default function StudentScheduleTimeline() {
  const router = useRouter();
  const [timelineDates, setTimelineDates] = useState<Date[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate the next 14 days for the timeline
    const dates = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i = 0; i < 14; i++) {
       const d = new Date(today);
       d.setDate(today.getDate() + i);
       dates.push(d);
    }
    setTimelineDates(dates);

    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    const activeStudentId = localStorage.getItem("icms_active_student");
    if (!activeStudentId) {
      router.replace("/");
      return;
    }

    // 1. Fetch Student Profile
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id, grade_batch")
      .eq("id", activeStudentId)
      .single();

    if (studentError?.code === 'PGRST116') {
      localStorage.removeItem("icms_active_student");
      router.replace("/");
      return;
    }

    if (!studentData) return;
    setStudent(studentData);

    // 2. Fetch Active Schedules
    const { data: allSchedules } = await supabase
      .from("schedules")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (allSchedules) {
      // 3. Filter schedules mapping to this specific student
      const targetedSchedules = allSchedules.filter(sch => {
        const isGlobal = sch.target_grades.length === 0 && sch.target_students.length === 0;
        const matchesGrade = sch.target_grades.includes(studentData.grade_batch);
        const matchesStudent = sch.target_students.includes(studentData.id);
        
        // Inherited targets for overrides are automatically handled because the admin clones them on save.
        return isGlobal || matchesGrade || matchesStudent;
      });
      setSchedules(targetedSchedules);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <CalendarDays className="w-12 h-12 text-blue-300 animate-pulse mb-6" />
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Syncing Timeline...</p>
      </div>
    );
  }

  // Segmenting schedules
  const recurringBase = schedules.filter(s => s.schedule_type === "recurring");
  const oneTimeBase = schedules.filter(s => s.schedule_type === "one_time");
  const overrides = schedules.filter(s => s.schedule_type === "override");

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans relative overflow-hidden">
      {/* Background Meshes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none fixed">
        <div className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,_rgba(253,230,138,0.2)_0%,_transparent_60%)]"></div>
        <div className="absolute bottom-[10%] -left-[10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,_rgba(191,219,254,0.3)_0%,_transparent_60%)]"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8">
        <button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-6 active:scale-95 w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <CalendarDays className="w-8 h-8 text-amber-500" /> My Timeline
          </h1>
          <p className="text-slate-500 font-medium mt-1">Your upcoming 14 days, carefully tailored to you.</p>
        </div>

        <div className="space-y-8">
          {timelineDates.map(dateObj => {
             const dayOfWeek = dateObj.getDay();
             const year = dateObj.getFullYear();
             const month = String(dateObj.getMonth() + 1).padStart(2, '0');
             const day = String(dateObj.getDate()).padStart(2, '0');
             const dateStr = `${year}-${month}-${day}`; // Accurate Local YYYY-MM-DD
             
             const todaysRecurring = recurringBase.filter(s => s.day_of_week === dayOfWeek);
             const todaysOneTime = oneTimeBase.filter(s => s.specific_date === dateStr);
             
             const dailyEventsRaw = [...todaysRecurring, ...todaysOneTime];
             
             // Resolve Overrides
             const resolvedEvents: any[] = [];
             
             // 1. Process base events falling exactly on this day naturally
             dailyEventsRaw.forEach(event => {
                 // Check if an override exists targeting this parent class ON this specific date
                 const relevantOverride = overrides.find(o => o.parent_schedule_id === event.id && o.specific_date === dateStr);
                 
                 if (relevantOverride) {
                    if (relevantOverride.override_action === 'cancel') {
                       // We push a "Ghost" cancelled event just so the student knows it was actively cancelled
                       resolvedEvents.push({ 
                          ...event, 
                          title: event.title,
                          isCancelled: true, 
                          note: "Cancelled" 
                       });
                    } else if (relevantOverride.override_action === 'reschedule') {
                       // Substitute the times and mark as rescheduled
                       resolvedEvents.push({ 
                          ...event, 
                          title: event.title,
                          start_time: relevantOverride.start_time, 
                          end_time: relevantOverride.end_time,
                          isRescheduled: true,
                          note: "Rescheduled"
                       });
                    }
                 } else {
                    // Normal run
                    resolvedEvents.push({ ...event });
                 }
             });

             // 2. Deep-catch: If they rescheduled a class to this day from a COMPLETELY DIFFERENT day of the week!
             const standaloneReschedules = overrides.filter(o => o.override_action === 'reschedule' && o.specific_date === dateStr);
             standaloneReschedules.forEach(o => {
                  // If we didn't already process this parent event in the normal loop above
                  if (!resolvedEvents.some(r => r.id === o.parent_schedule_id)) {
                      const parent = schedules.find(p => p.id === o.parent_schedule_id);
                      if (parent) {
                          resolvedEvents.push({
                              ...parent,
                              title: parent.title,
                              start_time: o.start_time,
                              end_time: o.end_time,
                              isRescheduled: true,
                              note: "Rescheduled"
                          });
                      }
                  }
             });

             // If this day has no events, we skip rendering it entirely to keep the timeline clean
             if (resolvedEvents.length === 0) return null;

             const todayLocal = new Date();
             const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
             
             const tomorrowLocal = new Date(Date.now() + 86400000);
             const tomorrowStr = `${tomorrowLocal.getFullYear()}-${String(tomorrowLocal.getMonth() + 1).padStart(2, '0')}-${String(tomorrowLocal.getDate()).padStart(2, '0')}`;
             
             const isToday = dateStr === todayStr;
             const isTomorrow = dateStr === tomorrowStr;
             
             let relativeLabel = "";
             if (isToday) relativeLabel = "TODAY";
             else if (isTomorrow) relativeLabel = "TOMORROW";
             else relativeLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

             return (
               <section key={dateStr} className="relative pl-6 sm:pl-8 border-l-2 border-slate-200/60 pb-4">
                  {/* Timeline Node Ring */}
                  {isToday ? (
                     <div className="absolute -left-[9px] top-0 w-4 h-4 bg-amber-400 rounded-full border-4 border-[#F8FAFC] shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10"></div>
                  ) : (
                     <div className="absolute -left-[5px] top-1.5 w-2 h-2 bg-slate-300 rounded-full"></div>
                  )}

                  <h2 className="text-sm font-black text-slate-800 tracking-widest mb-1">{relativeLabel}</h2>
                  <p className="text-xs font-bold text-slate-400 mb-4">{dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  
                  <div className="space-y-3">
                     {resolvedEvents.sort((a,b) => (a.start_time > b.start_time ? 1 : -1)).map((ev, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl border bg-white shadow-sm transition-all overflow-hidden relative ${ev.isCancelled ? 'border-red-200/50 opacity-70' : ev.isRescheduled ? 'border-amber-300' : 'border-slate-100'}`}>
                           
                           {/* Decorative Side Ribbon */}
                           <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${ev.isCancelled ? 'bg-red-400' : ev.schedule_type === 'one_time' ? 'bg-purple-400' : ev.isRescheduled ? 'bg-amber-400' : 'bg-blue-400'}`}></div>

                           {/* Header line */}
                           <div className="flex justify-between items-start mb-2 ml-2">
                              <div>
                                 <h3 className={`text-lg font-black ${ev.isCancelled ? 'line-through text-slate-400' : 'text-slate-800'}`}>{ev.title}</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                    {ev.isCancelled ? (
                                       <span className="text-[10px] uppercase font-black tracking-widest bg-red-50 text-red-600 px-2.5 py-1 rounded-md flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {ev.note}</span>
                                    ) : ev.isRescheduled ? (
                                       <span className="text-[10px] uppercase font-black tracking-widest bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {ev.note}</span>
                                    ) : (
                                       <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md ${ev.schedule_type === 'one_time' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                          <CheckCircle2 className="w-3 h-3 inline mr-1" /> {ev.schedule_type === 'one_time' ? 'Special Event' : 'Routine'}
                                       </span>
                                    )}
                                 </div>
                              </div>
                              
                              {!ev.isCancelled && (
                                 <div className="text-right shrink-0">
                                    <p className={`font-mono font-bold ${ev.isRescheduled ? 'text-amber-600' : 'text-slate-600'} text-sm bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2`}>
                                       <Clock className="w-3 h-3 text-slate-400" />
                                       {ev.start_time} <span className="text-slate-300 font-sans">—</span> {ev.end_time}
                                    </p>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
             );
          })}
          
          {timelineDates.length > 0 && schedules.length === 0 && (
             <div className="text-center py-20 bg-white/50 border border-dashed border-slate-200 rounded-3xl">
                <CalendarDays className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-400">Your Timeline is Clear</h3>
                <p className="text-slate-400 text-sm mt-1">There are no upcoming classes assigned to your batch.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
