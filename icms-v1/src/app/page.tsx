export default function Dashboard() {
  return (
    <main className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tuition Center Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder Stat Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Today's Attendance</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">--</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Pending Stickers</h3>
          <p className="text-4xl font-bold text-orange-500 mt-2">--</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Offline Scans Pending</h3>
          <p className="text-4xl font-bold text-red-500 mt-2">--</p>
        </div>
      </div>
    </main>
  );
}