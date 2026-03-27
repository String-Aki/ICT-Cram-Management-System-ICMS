"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminAuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    // Phase 2 Simulated Auth - Will be replaced by Supabase Auth in Phase 3
    setTimeout(() => {
      localStorage.setItem("icms_admin_auth", "true");
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row w-full font-sans">
      {/* LEFT PANEL: PUBLIC KIOSK LAUNCHER */}
      <div className="w-full md:w-5/12 lg:w-1/2 bg-slate-900 text-white flex flex-col justify-between p-8 md:p-16 relative overflow-hidden shrink-0">
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-32 h-32 bg-white rounded-2xl border-4 border-indigo-500 shadow-xl overflow-hidden mb-8 relative">
            <Image
              src="/icon.png"
              alt="ICMS Logo"
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
            ICMS Academy <br />
            <span className="text-indigo-400">Terminal</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-sm mb-12">
            Secure management system for administrators, and quick-access
            scanning for students.
          </p>
        </div>

        <div className="relative z-10">
          <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2rem] backdrop-blur-md">
            <div className="text-5xl mb-4">📷</div>
            <h2 className="text-2xl font-black mb-2">Automated Attendance</h2>
            <p className="text-slate-400 text-sm mb-8">
              Launch the QR scanner. This mode does not require
              administrator authentication.
            </p>
            <Link
              href="/check-in"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98]"
            >
              Launch Attendance Scanner <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: SECURE ADMIN LOGIN */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative">
        <div className="w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-700">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full text-2xl mb-4 shadow-inner border border-blue-100">
              🔒
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
              Admin Portal
            </h2>
            <p className="text-slate-500 font-medium">
              Please authenticate to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@icms.edu"
                className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-5 py-4 text-slate-800 font-medium outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-5 py-4 text-slate-800 font-medium outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-4 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
            >
              {isAuthenticating ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Authorize Session"
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Powered by ICMS v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
