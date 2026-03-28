"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { dispatchNativePush } from "@/lib/push";
import SNT from "@/components/StudentNameTransformer";

export default function MaterialsHub() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedGrade, setSelectedGrade] = useState<string>("All");
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<"material" | "homework">("material");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newXp, setNewXp] = useState(50);
  const [newDeadline, setNewDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [gradingMaterial, setGradingMaterial] = useState<any | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Set<string>>(new Set());
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, [selectedGrade]);

  const fetchMaterials = async () => {
    setIsLoading(true);

    const { data: gradesData } = await supabase
      .from("students")
      .select("grade_batch")
      .eq("is_active", true);
    if (gradesData) {
      const uniqueGrades = Array.from(
        new Set(gradesData.map((g) => g.grade_batch)),
      ).sort();
      // Remove "All" from the dynamic filter list if it accidentally got saved as a student's grade
      setAvailableGrades(uniqueGrades.filter(g => g !== "All"));
    }

    let query = supabase
      .from("class_materials")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (selectedGrade !== "All") {
      // THE FIX: Fetch materials for the selected grade OR materials marked for "All"
      query = query.in("grade_batch", [selectedGrade, "All"]);
    }

    const { data, error } = await query;
    if (data) setMaterials(data);
    setIsLoading(false);
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("class_materials").insert([
        {
          title: newTitle,
          description: newType === "homework" ? newDescription : null,
          type: newType,
          resource_url: newUrl || null,
          grade_batch: newGrade,
          xp_reward: newType === "homework" ? newXp : 0,
          deadline: newType === "homework" && newDeadline ? newDeadline : null,
          is_active: true,
        },
      ]);

      if (error) throw error;

      // Broadcast Push Notification silently to the exact Grade
      const targets = newGrade === "All" ? undefined : { gradeBatches: [newGrade] };
      const bodyText = newType === "homework"
        ? `"${newTitle}" has just dropped! Check it out and grab that XP! 🚀`
        : `"${newTitle}" has been uploaded. Tap to review your new study notes! 📘`;

      dispatchNativePush(
        {
          title: newType === "homework" ? "⭐ New Homework Quest!" : "📘 Fresh Study Material!",
          body: bodyText,
          url: newType === "homework" ? "/dashboard/quests" : "/dashboard"
        },
        targets
      );

      setIsAdding(false);
      setNewTitle("");
      setNewDescription("");
      setNewUrl("");
      setNewGrade("");
      setNewDeadline("");
      fetchMaterials();
    } catch (err) {
      console.error("Error adding material:", err);
      alert("Failed to save. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this? It will also delete all completion records for it.",
      )
    )
      return;
    await supabase.from("class_materials").delete().eq("id", id);
    fetchMaterials();
  };

  const closeQuest = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to close this quest? Students who haven't completed it will no longer be able to earn XP.",
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("class_materials")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;

      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_active: false } : m)),
      );
      setGradingMaterial((prev: any) =>
        prev ? { ...prev, is_active: false } : null,
      );
    } catch (err) {
      console.error("Failed to close quest:", err);
      alert("Database error.");
    }
  };

  const openGradingModal = async (material: any) => {
    setGradingMaterial(material);
    setIsGrading(true);

    const { data: studentsData } = await supabase
      .from("students")
      .select("id, full_name, qr_code, total_xp")
      .eq("is_active", true)
      .eq("grade_batch", material.grade_batch)
      .order("full_name", { ascending: true });

    if (studentsData) setRoster(studentsData);

    const { data: subsData } = await supabase
      .from("homework_submissions")
      .select("student_id")
      .eq("material_id", material.id);

    if (subsData) {
      setSubmissions(new Set(subsData.map((sub) => sub.student_id)));
    }
    setIsGrading(false);
  };

  const awardHomeworkXP = async (studentId: string, currentTotalXp: number) => {
    if (submissions.has(studentId) || !gradingMaterial.is_active) return;

    try {
      setSubmissions((prev) => new Set(prev).add(studentId));
      setRoster((prev) =>
        prev.map((s) => s.id === studentId ? { ...s, total_xp: s.total_xp + gradingMaterial.xp_reward } : s)
      );

      const { error: subError } = await supabase.from("homework_submissions").insert([
        { material_id: gradingMaterial.id, student_id: studentId },
      ]);
      if (subError) throw subError;

      // Write XP Receipt
      if (gradingMaterial.xp_reward > 0) {
         const { error: txError } = await supabase.from("xp_transactions").insert([{
           student_id: studentId,
           amount: gradingMaterial.xp_reward,
           reason: `Quest Completed: ${gradingMaterial.title}`
         }]);
         if (txError) throw txError;
      }

      const { error: xpError } = await supabase.from("students").update({
        total_xp: currentTotalXp + gradingMaterial.xp_reward,
      }).eq("id", studentId);
      if (xpError) throw xpError;

    } catch (err) {
      console.error("Failed to award XP:", err);
      const newSet = new Set(submissions);
      newSet.delete(studentId);
      setSubmissions(newSet);
      alert("Database error. XP not awarded.");
    }
  };

  const materialsList = materials.filter((m) => m.type === "material");
  const homeworkList = materials.filter((m) => m.type === "homework");

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      {/* MODAL 1: ADD NEW MATERIAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">
                  Add to Syllabus
                </h2>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  Upload a resource or create a quest.
                </p>
              </div>
              <div className="text-4xl">📚</div>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-5">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNewType("material")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${newType === "material" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  📘 Study Material
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("homework")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${newType === "homework" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  ⭐ Homework Quest
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Title
                </label>
                <input
                  required
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Notes, Week 2 Assignment"
                  className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-bold text-slate-700">
                      Target Grade
                    </label>
                    {/* THE FIX: 1-Click All Grades button */}
                    {newType === "material" && (
                      <button 
                        type="button" 
                        onClick={() => setNewGrade("All")}
                        className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-0.5 rounded uppercase tracking-widest font-bold transition-colors"
                      >
                        Apply to All
                      </button>
                    )}
                  </div>
                  <input
                    required
                    type="text"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    placeholder={newType === "material" ? "e.g. 10 or 'All'" : "e.g. 10"}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                {newType === "homework" && (
                  <div className="w-1/3">
                    <label className="block text-sm font-bold text-amber-600 mb-1">
                      XP Reward
                    </label>
                    <input
                      required
                      type="number"
                      value={newXp}
                      onChange={(e) => setNewXp(Number(e.target.value))}
                      className="w-full p-3 border-2 border-amber-200 bg-amber-50 text-amber-800 rounded-xl outline-none focus:border-amber-500 font-black"
                    />
                  </div>
                )}
              </div>

              {newType === "homework" && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Quest Description (Instructions)
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="e.g. Complete exercises 1-10 on page 42 and submit via the link below."
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium custom-scrollbar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-red-500 mb-1">
                      Deadline Date
                    </label>
                    <input
                      required
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full p-3 border-2 border-red-200 bg-red-50 text-red-800 rounded-xl outline-none focus:border-red-500 font-bold"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Resource Link (Optional: Google Drive, PDF, etc)
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 text-white font-black rounded-xl shadow-lg transition-all ${newType === "homework" ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/30" : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"}`}
                >
                  {isSubmitting ? "Saving..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TURN-IN ROSTER */}
      {gradingMaterial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div
              className={`p-6 md:p-8 border-b flex justify-between items-start shrink-0 ${gradingMaterial.is_active ? "bg-amber-50 border-amber-100" : "bg-slate-100 border-slate-200"}`}
            >
              <div>
                <div className="flex gap-2 mb-3">
                  <span
                    className={`${gradingMaterial.is_active ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-slate-200 text-slate-600 border-slate-300"} text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border`}
                  >
                    Grade {gradingMaterial.grade_batch} Roster
                  </span>
                  {!gradingMaterial.is_active && (
                    <span className="bg-slate-800 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-slate-900">
                      Quest Closed
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-800">
                  {gradingMaterial.title}
                </h2>
                <p
                  className={`${gradingMaterial.is_active ? "text-amber-600" : "text-slate-500"} font-bold mt-1`}
                >
                  Bounty: +{gradingMaterial.xp_reward} XP
                  {gradingMaterial.deadline &&
                    ` • Due: ${new Date(gradingMaterial.deadline).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => setGradingMaterial(null)}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200 font-bold"
                >
                  ✕
                </button>
                {gradingMaterial.is_active && (
                  <button
                    onClick={() => closeQuest(gradingMaterial.id)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                  >
                    End Deadline (Close Quest)
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 md:p-8 bg-slate-50">
              {isGrading ? (
                <div className="text-center py-10 text-slate-400 font-bold animate-pulse">
                  Loading class roster...
                </div>
              ) : roster.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold">
                  No active students found in Grade{" "}
                  {gradingMaterial.grade_batch}.
                </div>
              ) : (
                <div className="space-y-3">
                  {roster.map((student) => {
                    const isCompleted = submissions.has(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isCompleted ? "bg-white border-emerald-100 shadow-sm opacity-60" : !gradingMaterial.is_active ? "bg-slate-100 border-slate-200 opacity-60" : "bg-white border-slate-200 shadow-sm hover:border-amber-300"}`}
                      >
                        <div>
                          <p
                            className={`font-bold text-lg ${isCompleted ? "text-slate-500 line-through" : !gradingMaterial.is_active ? "text-slate-500" : "text-slate-800"}`}
                          >
                            {SNT(student.full_name)}
                          </p>
                          <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">
                            {student.qr_code} • {student.total_xp} XP
                          </p>
                        </div>

                        {isCompleted ? (
                          <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-black border border-emerald-100 flex items-center gap-2">
                            <span>✅</span> Rewarded
                          </span>
                        ) : !gradingMaterial.is_active ? (
                          <span className="bg-slate-200 text-slate-500 px-4 py-2 rounded-xl text-sm font-black border border-slate-300 flex items-center gap-2">
                            <span>❌</span> Missed
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              awardHomeworkXP(student.id, student.total_xp)
                            }
                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-black transition-colors flex items-center gap-2"
                          >
                            <span>⭐</span> Mark Done
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD */}
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-blue-100">
              📚
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Curriculum Hub
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Manage study materials and award XP for completed homework.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5"
          >
            + Add Material
          </button>
        </header>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-2">
            Filter by Grade:
          </span>
          <button
            onClick={() => setSelectedGrade("All")}
            className={`px-5 py-2 rounded-xl font-bold text-sm shrink-0 transition-all ${selectedGrade === "All" ? "bg-slate-800 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            All Grades
          </button>
          {availableGrades.map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-5 py-2 rounded-xl font-bold text-sm shrink-0 transition-all ${selectedGrade === grade ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
            >
              Grade {grade}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold animate-pulse">
            Loading curriculum...
          </div>
        ) : materials.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="text-6xl mb-4 opacity-50 grayscale">📭</div>
            <h3 className="text-xl font-black text-slate-800">
              No materials found
            </h3>
            <p className="text-slate-500 font-medium mt-1">
              Upload your first study note or homework assignment to get
              started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* STUDY MATERIALS */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span>📘</span> Study Materials
              </h2>
              {materialsList.length === 0 ? (
                <p className="text-slate-400 font-medium text-sm p-4 bg-white rounded-2xl border border-slate-200 border-dashed text-center">
                  No general materials available for this filter.
                </p>
              ) : (
                materialsList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex justify-between items-center"
                  >
                    <div>
                      {/* THE FIX: Formatting "All" beautifully */}
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-slate-200 mb-2 inline-block">
                        {item.grade_batch === "All" ? "All Grades" : `Grade ${item.grade_batch}`}
                      </span>
                      <h3 className="font-bold text-slate-800 text-lg line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={item.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors"
                        title="Open Link"
                      >
                        🔗
                      </a>
                      <button
                        onClick={() => deleteMaterial(item.id)}
                        className="w-10 h-10 bg-slate-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* HOMEWORK QUESTS */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span>⭐</span> Homework Quests
              </h2>
              {homeworkList.length === 0 ? (
                <p className="text-slate-400 font-medium text-sm p-4 bg-white rounded-2xl border border-slate-200 border-dashed text-center">
                  No homework assignments for this filter.
                </p>
              ) : (
                homeworkList.map((item) => (
                  <div
                    key={item.id}
                    className={`${item.is_active ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200" : "bg-slate-100 border-slate-200"} p-1 rounded-2xl shadow-sm hover:shadow-md transition-all group border`}
                  >
                    <div className="bg-white p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`${item.is_active ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"} text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border`}
                          >
                            {item.grade_batch === "All" ? "All Grades" : `Grade ${item.grade_batch}`}
                          </span>
                          {item.is_active ? (
                            <span className="text-xs font-black text-amber-500">
                              +{item.xp_reward} XP
                            </span>
                          ) : (
                            <span className="text-xs font-black text-slate-400">
                              Closed
                            </span>
                          )}
                        </div>
                        <h3
                          className={`font-black text-lg line-clamp-1 ${item.is_active ? "text-slate-800" : "text-slate-500"}`}
                        >
                          {item.title}
                        </h3>

                        <p className="text-xs font-medium text-slate-400 mt-1">
                          Posted{" "}
                          {new Date(item.created_at).toLocaleDateString()}
                          {item.deadline && (
                            <span
                              className={`font-bold ml-2 ${item.is_active ? "text-amber-600" : "text-slate-400"}`}
                            >
                              • Due:{" "}
                              {new Date(item.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <a
                          href={item.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
                          title="View Details"
                        >
                          🔗
                        </a>
                        <button
                          onClick={() => openGradingModal(item)}
                          className={`flex-1 sm:flex-none px-4 py-2.5 text-white font-black rounded-xl transition-all whitespace-nowrap ${item.is_active ? "bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20" : "bg-slate-800 hover:bg-slate-700 shadow-md shadow-slate-800/20"}`}
                        >
                          {item.is_active
                            ? "Check Submissions"
                            : "View Records"}
                        </button>
                        <button
                          onClick={() => deleteMaterial(item.id)}
                          className="w-10 h-10 bg-white border border-red-100 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          title="Delete Quest"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}