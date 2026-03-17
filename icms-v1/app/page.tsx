import AttendanceScanner from "../src/components/AttendanceScanner";
import IDCardGenerator from "../src/components/IDCardGenerator";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">ICMS v1.0</h1>
        <p className="text-gray-600">Scan student ID to record attendance</p>
      </div>

      <AttendanceScanner />
      <div className="mt-8">
        <IDCardGenerator
          studentName="John Doe"
          studentId="uuid-1234-5678-9012"
        />
      </div>
    </main>
  );
}
