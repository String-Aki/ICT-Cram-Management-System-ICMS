"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import SNT from "@/components/StudentNameTransformer";

export default function StudentsHub() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "dropped" | "all">("active");

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]); // Re-fetch if they change the main tab

  const fetchStudents = async () => {
    setIsLoading(true);
    
    let query = supabase.from("students").select("*").order("full_name", { ascending: true });
    
    // Apply the Soft Delete filter!
    if (statusFilter === "active") query = query.eq("is_active", true);
    if (statusFilter === "dropped") query = query.eq("is_active", false);

    const { data, error } = await query;
    if (error) console.error("Error fetching students:", error);
    if (data) setStudents(data);
    
    setIsLoading(false);
  };

  // --- ACTION: SOFT DELETE / REACTIVATE ---
  const toggleStudentStatus = async (id: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${action} ${name}?`)) return;

    // We just flip the boolean! The data stays perfectly safe.
    const { error } = await supabase.from("students").update({ is_active: !currentStatus }).eq("id", id);
    if (!error) fetchStudents();
  };

  // --- ACTION: REPRINT LOST ID ---
  const requestReprint = async (studentId: string, name: string) => {
    if (!confirm(`Send ${name}'s ID card to the Print Hub?`)) return;

    // Check if they are already in the queue so we don't spam it
    const { data: existing } = await supabase
      .from("card_print_queue")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "pending")
      .single();

    if (existing) {
      alert("This student is already in the print queue!");
      return;
    }

    const { error } = await supabase.from("card_print_queue").insert([{ student_id: studentId }]);
    if (!error) alert(`✅ Added to Print Hub Queue!`);
  };

  // Client-side search filtering
  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.qr_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.grade_batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER & CONTROLS */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-indigo-100">
                👥
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Students Hub</h1>
            </div>
            <p className="text-slate-500 font-medium">Manage enrollments, track dropouts, and request ID reprints.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
            <input 
              type="text" 
              placeholder="Search names, IDs, or grades..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-72 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </header>

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl w-fit">
          <button 
            onClick={() => setStatusFilter("active")} 
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${statusFilter === "active" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Active Students
          </button>
          <button 
            onClick={() => setStatusFilter("dropped")} 
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${statusFilter === "dropped" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Dropped Out
          </button>
          <button 
            onClick={() => setStatusFilter("all")} 
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${statusFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            All Records
          </button>
        </div>

        {/* THE DATA GRID */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64">
               <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
               <p className="text-slate-400 font-bold animate-pulse">Loading Roster...</p>
             </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="text-5xl mb-4 opacity-50 grayscale">👻</div>
              <h3 className="text-xl font-black text-slate-800">No students found</h3>
              <p className="text-slate-500 font-medium mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                    <th className="p-4 font-bold">Student Details</th>
                    <th className="p-4 font-bold">Short ID</th>
                    <th className="p-4 font-bold">Grade</th>
                    <th className="p-4 font-bold">Total XP</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className={`transition-colors hover:bg-slate-50 ${!student.is_active ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-2 ${student.is_active ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                            {SNT(student.full_name).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{SNT(student.full_name)}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Enrolled: {student.enrollment_date}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-mono text-xs font-bold border border-slate-200">
                          {student.qr_code}
                        </span>
                      </td>
                      
                      <td className="p-4 font-bold text-slate-600">
                        {student.grade_batch}
                      </td>

                      <td className="p-4 font-black text-amber-500">
                        {student.total_xp} <span className="text-xs text-amber-300">XP</span>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {/* Reprint Button - Only show if active */}
                        {student.is_active && (
                          <button 
                            onClick={() => requestReprint(student.id, SNT(student.full_name))}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold text-xs rounded-lg transition-colors"
                            title="Send to Print Hub"
                          >
                            🖨️ Reprint ID
                          </button>
                        )}
                        
                        {/* Soft Delete / Reactivate Toggle */}
                        <button 
                          onClick={() => toggleStudentStatus(student.id, student.is_active, SNT(student.full_name))}
                          className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-colors ${student.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        >
                          {student.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}