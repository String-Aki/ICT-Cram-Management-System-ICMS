import EnrollStudentForm from "../../src/components//EnrollStudentForm";
import { supabase } from "@/src/lib/supabase";
export const dynamic = "force-dynamic";

export default async function StudentsDirectory() {
  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch students:", error);
  }

  return (
    <main className="p-4 md:p-8 h-full flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Student Directory</h1>
        <p className="text-gray-500">Manage admissions, IDs, and profiles</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
        <section className="md:col-span-1">
          <EnrollStudentForm />
        </section>

        <section className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[535px]">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🎓 Enrolled Students{" "}
            <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {students?.length || 0} Total
            </span>
          </h2>

          <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
            {students && students.length > 0 ? (
              students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group"
                >
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                      {student.full_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {student.grade_batch}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full font-mono group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                      {student.qr_code}
                    </span>
                    <span className="text-sm font-bold text-orange-500">
                      ⭐ {student.total_xp} XP
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-lg">No students enrolled yet.</p>
                <p className="text-sm">
                  Use the form on the left to add your first student.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
