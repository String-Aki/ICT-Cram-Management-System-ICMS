import { redirect } from "next/navigation";

export default function AdminAuthPage() {
  redirect("/dashboard");
}

/* --- TEMPORARILY DISABLED AUTH PAGE ---
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // <-- Added Supabase

export default function AdminAuthPageBackup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, []);

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row w-full font-sans">
      <div className="w-full md:w-5/12 lg:w-1/2 bg-slate-900 text-white flex flex-col justify-between p-8 md:p-16 relative overflow-hidden shrink-0">
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-32 h-32 bg-white rounded-2xl border-4 border-indigo-500 shadow-xl overflow-hidden mb-8 relative">
            <Image src="/icon.png" alt="ICMS Logo" fill sizes="128px" className="object-cover" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
            ICMS Academy <br />
            <span className="text-indigo-400">Terminal</span>
          </h1>
        </div>
      </div>
    </div>
  );
}
*/