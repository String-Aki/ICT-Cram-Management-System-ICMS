"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Import our new components
import TopNav from "@/components/dashboard/TopNav";
import HeroStats from "@/components/dashboard/HeroStats";
import QuestHub from "@/components/dashboard/QuestHub";
import ClassCycle from "@/components/dashboard/ClassCycle";
import ArenaButton from "@/components/dashboard/ArenaButton";
import VaultButton from "@/components/dashboard/VaultButton";
import ExamVaultButton from "@/components/dashboard/ExamVaultButton";
import PaymentsButton from "@/components/dashboard/PaymentsButton";
import AchievementsButton from "@/components/dashboard/AchievementsButton";

export default function StudentDashboard() {
  const router = useRouter();
  
  const [student, setStudent] = useState<any>(null);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const activeStudentId = localStorage.getItem("icms_active_student");
      if (!activeStudentId) {
        router.replace("/"); 
        return;
      }

      try {
        // Fetch Core Student Data
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, full_name, qr_code, total_xp, card_variant, cycle_classes, grade_batch")
          .eq("id", activeStudentId)
          .single();

        if (studentError) throw studentError;
        setStudent(studentData);

        // Fetch Quests
        const { data: materials, error: matError } = await supabase
          .from("class_materials")
          .select("*")
          .eq("grade_batch", studentData.grade_batch)
          .eq("type", "homework")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (matError) throw matError;

        // Fetch Submissions to filter Quests
        const { data: submissions, error: subError } = await supabase
          .from("homework_submissions")
          .select("material_id")
          .eq("student_id", studentData.id);

        if (subError) throw subError;

        const completedIds = new Set(submissions?.map(s => s.material_id) || []);
        const pendingQuests = materials?.filter(m => !completedIds.has(m.id)) || [];

        setActiveQuests(pendingQuests);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Player Data...</p>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-indigo-500 selection:text-white relative">
      <TopNav studentName={student.full_name} />

      <main className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 relative z-10">
        <HeroStats 
          totalXp={student.total_xp} 
          cardVariant={student.card_variant} 
          qrCode={student.qr_code} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuestHub activeQuests={activeQuests} />
          <ClassCycle studentId={student.id} cycleClasses={student.cycle_classes} />
          
          <VaultButton />
          <ExamVaultButton />
          <PaymentsButton />
          
          {/* REPLACED THE PLACEHOLDER WITH THIS: */}
          <AchievementsButton />

          <div className="md:col-span-2 mt-2">
            <ArenaButton />
          </div>
        </div>
      </main>
    </div>
  );
}