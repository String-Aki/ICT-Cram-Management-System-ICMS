import AttendanceScanner from "../../src/components//AttendanceScanner";

export default function AttendanceKiosk() {
  return (
    <main className="p-4 md:p-8 h-full flex flex-col">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Live Attendance Kiosk</h1>
        <p className="text-gray-500">Scan student ID to record entry</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        
        <section className="md:w-3/5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[400px]">
          <AttendanceScanner />
        </section>

        <section className="md:w-2/5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🟢 Live Feed
            </h2>
            
            {/* This is a placeholder for the live feed. Later we will wire this up to show the actual scanned student's face and XP! */}
            <div className="flex flex-col gap-3">
              <div className="animate-pulse flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <p className="text-sm text-gray-400 text-center mt-4">Waiting for next scan...</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}