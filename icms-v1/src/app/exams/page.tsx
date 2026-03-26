"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import SNT from "@/components/StudentNameTransformer";

export default function ExamsHub() {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<string>("All");
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  // Add Exam Modal
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newTotalMarks, setNewTotalMarks] = useState(100);
  const [newMaxXp, setNewMaxXp] = useState(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Grading Modal
  const [gradingExam, setGradingExam] = useState<any | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [existingResults, setExistingResults] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, number | "">>(({}));
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchExams();
  }, [selectedGrade]);

  const fetchExams = async () => {
    setIsLoading(true);

    const { data: gradesData } = await supabase.from("students").select("grade_batch").eq("is_active", true);
    if (gradesData) {
      const uniqueGrades = Array.from(new Set(gradesData.map(g => g.grade_batch))).sort();
      setAvailableGrades(uniqueGrades);
    }

    let query = supabase.from("exams").select("*").order("created_at", { ascending: false });
    if (selectedGrade !== "All") query = query.eq("grade_batch", selectedGrade);

    const { data } = await query;
    if (data) setExams(data);
    setIsLoading(false);
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("exams").insert([{
        title: newTitle,
        grade_batch: newGrade,
        total_marks: newTotalMarks,
        max_xp: newMaxXp,
        is_completed: false
      }]);

      if (error) throw error;

      setIsAdding(false);
      setNewTitle("");
      setNewGrade("");
      setNewTotalMarks(100);
      setNewMaxXp(1000);
      fetchExams();
    } catch (err) {
      console.error("Error adding exam:", err);
      alert("Failed to create exam.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExam = async (id: string) => {
    if (!confirm("Delete this exam? All student scores and history for this test will be wiped.")) return;
    await supabase.from("exams").delete().eq("id", id);
    fetchExams();
  };

  // --- MARK EXAM AS COMPLETED ---
  const completeExam = async (id: string) => {
    if (!confirm("Mark this exam as completed? You will no longer be able to publish new grades for it.")) return;
    
    try {
      const { error } = await supabase.from("exams").update({ is_completed: true }).eq("id", id);
      if (error) throw error;
      
      setExams(prev => prev.map(e => e.id === id ? { ...e, is_completed: true } : e));
      setGradingExam((prev: any) => prev ? { ...prev, is_completed: true } : null);
      
    } catch (err) {
      console.error("Failed to complete exam:", err);
      alert("Database error.");
    }
  };

  // --- BULK GRADING SYSTEM ---
  const openGradingModal = async (exam: any) => {
    setGradingExam(exam);
    setScores({});
    
    const { data: studentsData } = await supabase
      .from("students")
      .select("id, full_name, qr_code, total_xp")
      .eq("is_active", true)
      .eq("grade_batch", exam.grade_batch)
      .order("full_name", { ascending: true });

    if (studentsData) setRoster(studentsData);

    const { data: resultsData } = await supabase
      .from("exam_results")
      .select("student_id, score, xp_awarded")
      .eq("exam_id", exam.id);

    if (resultsData) {
      const gradedIds = new Set(resultsData.map(r => r.student_id));
      setExistingResults(gradedIds);
      
      const existingScores: Record<string, number> = {};
      resultsData.forEach(r => {
        existingScores[r.student_id] = r.score;
      });
      setScores(existingScores);
    }
  };

  const handleScoreChange = (studentId: string, value: string) => {
    if (gradingExam.is_completed) return; 

    let numValue = parseInt(value);
    if (isNaN(numValue)) {
      setScores(prev => ({ ...prev, [studentId]: "" }));
      return;
    }
    if (numValue > gradingExam.total_marks) numValue = gradingExam.total_marks;
    if (numValue < 0) numValue = 0;
    
    setScores(prev => ({ ...prev, [studentId]: numValue }));
  };

  const calculateDynamicXp = (score: number | "") => {
    if (score === "") return 0;
    const percentage = score / gradingExam.total_marks;
    return Math.round(percentage * gradingExam.max_xp);
  };

  const publishGrades = async () => {
    if (gradingExam.is_completed) return;
    setIsPublishing(true);
    
    const studentsToGrade = roster.filter(s => 
      !existingResults.has(s.id) && 
      scores[s.id] !== undefined && 
      scores[s.id] !== ""
    );

    if (studentsToGrade.length === 0) {
      alert("No new grades to publish.");
      setIsPublishing(false);
      return;
    }

    if (!confirm(`Publish grades and award XP to ${studentsToGrade.length} students?`)) {
      setIsPublishing(false);
      return;
    }

    try {
      const promises = studentsToGrade.map(async (student) => {
        const finalScore = scores[student.id] as number;
        const awardedXp = calculateDynamicXp(finalScore);

        const { error: resultError } = await supabase.from("exam_results").insert([{
          exam_id: gradingExam.id,
          student_id: student.id,
          score: finalScore,
          xp_awarded: awardedXp
        }]);
        if (resultError) throw resultError;

        if (awardedXp > 0) {
          const { error: txError } = await supabase.from("xp_transactions").insert([{
            student_id: student.id,
            amount: awardedXp,
            reason: `Exam Score: ${gradingExam.title}`
          }]);
          if (txError) throw txError;
        }

        const { error: xpError } = await supabase.from("students").update({
          total_xp: student.total_xp + awardedXp
        }).eq("id", student.id);
        if (xpError) throw xpError;
      });

      await Promise.all(promises);

      await openGradingModal(gradingExam);
      alert("✅ Grades Published Successfully!");

    } catch (err) {
      console.error("Failed to publish grades:", err);
      alert("An error occurred while saving. Some grades may not have published.");
    } finally {
      setIsPublishing(false);
    }
  };

  const pendingExams = exams.filter(e => !e.is_completed);
  const completedExams = exams.filter(e => e.is_completed);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      
      {/* --- ADD EXAM MODAL --- */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">New Exam Event</h2>
                <p className="text-sm font-bold text-slate-500 mt-1">Create a test and configure the XP pool.</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>

            <form onSubmit={handleAddExam} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Exam Title</label>
                <input required type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Mid-Term Theory Exam" className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium"/>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Grade Batch</label>
                <input required type="text" value={newGrade} onChange={(e) => setNewGrade(e.target.value)} placeholder="e.g. 11" className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold"/>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Total Marks</label>
                  <input required type="number" value={newTotalMarks} onChange={(e) => setNewTotalMarks(Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold"/>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-black text-indigo-600 mb-1">Max XP Reward</label>
                  <input required type="number" value={newMaxXp} onChange={(e) => setNewMaxXp(Number(e.target.value))} className="w-full p-3 border-2 border-indigo-200 bg-indigo-50 text-indigo-800 rounded-xl outline-none focus:border-indigo-500 font-black"/>
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 text-center">
                A student scoring 100% will receive the Max XP Reward. Lower scores will be calculated proportionally.
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all">
                  {isSubmitting ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BULK GRADING MODAL --- */}
      {gradingExam && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className={`p-6 md:p-8 border-b flex justify-between items-center shrink-0 ${gradingExam.is_completed ? 'bg-slate-100 border-slate-200' : 'bg-indigo-50 border-indigo-100'}`}>
              <div>
                <div className="flex gap-2 mb-3">
                  <span className={`${gradingExam.is_completed ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-indigo-100 text-indigo-800 border-indigo-200'} text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border`}>
                    Grade {gradingExam.grade_batch} Roster
                  </span>
                  {gradingExam.is_completed && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span>✅</span> Completed & Locked
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-800">{gradingExam.title}</h2>
                <p className={`${gradingExam.is_completed ? 'text-slate-500' : 'text-indigo-600'} font-bold mt-1`}>
                  Out of {gradingExam.total_marks} Marks • {gradingExam.max_xp} XP Max
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setGradingExam(null)} className="px-5 py-2.5 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">Close Form</button>
                  {!gradingExam.is_completed && (
                    <button 
                      onClick={publishGrades}
                      disabled={isPublishing}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isPublishing ? "Saving..." : "📤 Publish Grades"}
                    </button>
                  )}
                </div>
                {!gradingExam.is_completed && (
                   <button onClick={() => completeExam(gradingExam.id)} className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors px-2">
                     ✓ Mark Exam as Completed
                   </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 md:p-8 bg-slate-50 custom-scrollbar">
              {roster.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold">No active students found in Grade {gradingExam.grade_batch}.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200 shadow-sm sticky top-0 z-10">
                      <th className="p-4 font-bold rounded-tl-xl">Student Details</th>
                      <th className="p-4 font-bold text-center">Score (/{gradingExam.total_marks})</th>
                      <th className="p-4 font-bold text-right rounded-tr-xl">XP Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white shadow-sm border border-slate-100 rounded-b-xl">
                    {roster.map(student => {
                      const isGraded = existingResults.has(student.id);
                      const currentVal = scores[student.id];
                      const calcXp = calculateDynamicXp(currentVal === undefined ? "" : currentVal);

                      return (
                        <tr key={student.id} className={`transition-colors ${isGraded || gradingExam.is_completed ? 'bg-slate-50 opacity-70' : 'hover:bg-indigo-50/30'}`}>
                          <td className="p-4">
                            <p className={`font-bold text-lg ${isGraded || gradingExam.is_completed ? 'text-slate-500' : 'text-slate-800'}`}>{SNT(student.full_name)}</p>
                            <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">{student.qr_code}</p>
                          </td>
                          <td className="p-4 text-center">
                            {isGraded || gradingExam.is_completed ? (
                              <span className="font-black text-lg text-slate-600 font-mono bg-slate-200 px-4 py-2 rounded-lg">
                                {currentVal !== undefined && currentVal !== "" ? currentVal : "--"}
                              </span>
                            ) : (
                              <input 
                                type="number" 
                                value={currentVal !== undefined ? currentVal : ""}
                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                placeholder="--"
                                className="w-24 p-2 text-center border-2 border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-black text-lg text-indigo-700 bg-slate-50"
                              />
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <span className={`font-black text-lg ${isGraded || gradingExam.is_completed ? 'text-slate-500' : calcXp > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                              +{calcXp} XP
                            </span>
                            {isGraded && <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Published</p>}
                            {!isGraded && gradingExam.is_completed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Missed</p>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN DASHBOARD --- */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-indigo-100">
              📝
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Exam & Grading Hub</h1>
              <p className="text-slate-500 font-medium mt-1">Record test scores and award proportional XP.</p>
            </div>
          </div>
          <button onClick={() => setIsAdding(true)} className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5">
            + New Exam
          </button>
        </header>

        {/* GRADE FILTER */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-2">Filter by Grade:</span>
          <button 
            onClick={() => setSelectedGrade("All")}
            className={`px-5 py-2 rounded-xl font-bold text-sm shrink-0 transition-all ${selectedGrade === "All" ? "bg-slate-800 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            All Grades
          </button>
          {availableGrades.map(grade => (
            <button 
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-5 py-2 rounded-xl font-bold text-sm shrink-0 transition-all ${selectedGrade === grade ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
            >
              Grade {grade}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center">
             <div className="text-6xl mb-4 opacity-50 grayscale">📭</div>
             <h3 className="text-xl font-black text-slate-800">No exams found</h3>
             <p className="text-slate-500 font-medium mt-1">Create an exam to start logging scores and awarding XP.</p>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* PENDING EXAMS SECTION */}
            {pendingExams.length > 0 && (
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span> Pending Grading
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingExams.map(exam => (
                    <div key={exam.id} className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900"></div>
                      <div>
                        <div className="flex justify-between items-start mb-4 pl-2">
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-indigo-100">
                            Grade {exam.grade_batch}
                          </span>
                          <button onClick={() => deleteExam(exam.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            🗑️
                          </button>
                        </div>
                        <h3 className="font-black text-slate-800 text-xl leading-tight mb-2 pl-2">{exam.title}</h3>
                        <div className="flex items-center gap-4 text-sm font-bold mt-4 pl-2">
                          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-slate-600">
                            <span className="text-slate-400 mr-1">Max</span>{exam.total_marks} Marks
                          </div>
                          <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 text-amber-700 flex items-center gap-1">
                            <span>⭐</span> {exam.max_xp} XP
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => openGradingModal(exam)}
                        className="w-full mt-6 py-3 bg-slate-900 hover:bg-indigo-500 text-white font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 hover:-translate-y-0.5"
                      >
                        Grade Class
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPLETED EXAMS SECTION */}
            {completedExams.length > 0 && (
              <div>
                <h2 className="text-xl font-black text-slate-400 flex items-center gap-2 mb-4">
                  <span>✅</span> Completed & Archived
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                  {completedExams.map(exam => (
                    <div key={exam.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between group">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-slate-300">
                            Grade {exam.grade_batch}
                          </span>
                          <button onClick={() => deleteExam(exam.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            🗑️
                          </button>
                        </div>
                        <h3 className="font-bold text-slate-600 text-xl leading-tight mb-2">{exam.title}</h3>
                        <div className="flex items-center gap-4 text-sm font-bold mt-4">
                          <div className="text-slate-500">
                            <span className="text-slate-400 mr-1">Max</span>{exam.total_marks} Marks
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => openGradingModal(exam)}
                        className="w-full mt-6 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all shadow-sm"
                      >
                        View Results
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}