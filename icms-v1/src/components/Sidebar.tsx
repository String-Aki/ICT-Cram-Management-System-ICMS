"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (pathname === "/" || pathname === "/check-in") {
    return null;
  }

const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Enroll", href: "/enroll", icon: "📋" },
    { name: "Students Hub", href: "/students", icon: "🎓" },
    { name: "Attendance", href: "/attendance", icon: "✅" },
    { name: "Financials", href: "/payments", icon: "💳" },
    { name: "Curriculum", href: "/materials", icon: "📚" },
    { name: "Exams & Grades", href: "/exams", icon: "📝" },
    { name: "Leaderboard", href: "/leaderboard", icon: "🏆" },
    { name: "Achievements", href: "/achievements", icon: "⭐" },
  ];

  if (!isMounted) return null;

  return (
    <nav className="bg-white border-r border-slate-200 w-full md:w-64 lg:w-72 flex-shrink-0 md:h-screen sticky top-0 flex flex-col z-50 print:hidden">
      <div className="p-6 md:p-8 flex items-center gap-4 border-b border-slate-100">
        <div className="relative w-12 h-12 rounded-2xl border-2 border-blue-600 shadow-lg shadow-indigo-500/25 shrink-0 overflow-hidden">
          <Image
            src="/icon.png"
            alt="ICMS Logo"
            fill
            sizes="48px"
            className="object-cover"
            priority
          />
        </div>
        <div className="hidden md:block">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            ICMS
          </h1>
          <p className="text-blue-500 font-bold text-[10px] tracking-[0.2em] uppercase mt-1">
            Admin Portal
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 hidden md:block px-4">
          Management
        </div>

        <ul className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-4">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (pathname.startsWith(link.href) && link.href !== "/dashboard");

            return (
              <li key={link.name} className="flex-1 md:flex-none">
                <Link
                  href={link.href}
                  className={`flex items-center justify-center md:justify-start gap-4 px-4 py-3.5 rounded-2xl transition-all whitespace-nowrap font-bold group ${
                    isActive
                      ? "bg-slate-100 text-slate shadow-md shadow-slate-800/10 scale-[1.02]"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`text-xl transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                  >
                    {link.icon}
                  </span>
                  <span className="hidden md:block">{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="hidden md:block p-6 mt-auto border-t border-slate-100 bg-white">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:bg-red-50 hover:border-red-100 transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 group-hover:bg-red-100 group-hover:text-red-600 flex items-center justify-center font-black shrink-0 transition-colors">
            🚪
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-black text-slate-800 group-hover:text-red-700 truncate transition-colors">
              Sign Out
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-red-500 transition-colors"></span>
              <p className="text-[10px] font-bold text-slate-500 group-hover:text-red-500 uppercase tracking-widest transition-colors">
                Lock Session
              </p>
            </div>
          </div>
        </button>
      </div>
    </nav>
  );
}
