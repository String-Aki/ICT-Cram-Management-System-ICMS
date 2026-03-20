"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/", icon: "📊" },
    { name: "Attendance", href: "/attendance", icon: "✅" },
    { name: "Students", href: "/students", icon: "🎓" },
    { name: "Schedule", href: "/schedule", icon: "📅" }, 
    { name: "Leaderboard", href: "/leaderboard", icon: "🏆" },
  ];

  return (
    <nav className="bg-blue-900 text-white w-full md:w-64 flex-shrink-0 md:h-screen sticky top-0 md:flex md:flex-col z-50 print:hidden">
      <div className="p-4 md:p-6 text-center md:text-left border-b border-blue-800">
        <h1 className="text-2xl font-bold tracking-wider">ICMS <span className="text-blue-400">v1.0</span></h1>
      </div>
      
      <ul className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-4 gap-2 scrollbar-hide">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/");
          
          return (
            <li key={link.name} className="flex-1 md:flex-none">
              <Link 
                href={link.href}
                className={`flex items-center justify-center md:justify-start gap-3 p-3 rounded-lg transition-colors whitespace-nowrap ${
                  isActive ? "bg-blue-700 text-white font-bold shadow-inner" : "text-blue-200 hover:bg-blue-800 hover:text-white"
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="hidden md:block">{link.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}