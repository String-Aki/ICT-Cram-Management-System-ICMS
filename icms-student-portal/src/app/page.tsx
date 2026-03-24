"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Html5QrcodeScanner } from "html5-qrcode";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

export default function StudentLoginGateway() {
  const router = useRouter();

  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [view, setView] = useState<"picker" | "login">("login");

  const [shortId, setShortId] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedName, setSelectedName] = useState("");

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const storedAccounts = localStorage.getItem("icms_saved_accounts");
    const lastActiveId = localStorage.getItem("icms_active_student");

    if (storedAccounts) {
      const accounts = JSON.parse(storedAccounts);
      if (accounts.length > 0) {
        setSavedAccounts(accounts);

        if (lastActiveId) {
          const defaultAccount = accounts.find(
            (a: any) => a.id === lastActiveId,
          );
          if (defaultAccount) {
            setShortId(defaultAccount.qrCode);
            setSelectedName(defaultAccount.fullName);
            setView("login");
          } else {
            setView("picker");
          }
        } else {
          setView("picker");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!isScanning) return;

    const scanner = new Html5QrcodeScanner(
      "student-qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );

    scanner.render(
      (decodedText) => {
        setShortId(formatShortId(decodedText));
        setIsScanning(false);
        scanner.clear();
      },
      (err) => {},
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isScanning]);

  const formatShortId = (value: string) => {
    let raw = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    let formatted = raw;
    if (raw.length > 4) {
      formatted = raw.substring(0, 4) + "-" + raw.substring(4);
    }
    if (raw.length > 5) {
      formatted =
        raw.substring(0, 4) +
        "-" +
        raw.substring(4, 5) +
        "-" +
        raw.substring(5, 11);
    }
    return formatted;
  };

  const handleShortIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShortId(formatShortId(e.target.value));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data: student, error: fetchError } = await supabase
        .from("students")
        .select("id, full_name, qr_code, is_active")
        .eq("qr_code", shortId)
        .eq("pin_code", pin)
        .single();

      if (fetchError || !student) {
        throw new Error("Invalid ID or PIN. Please try again.");
      }

      if (!student.is_active) {
        throw new Error("This account is currently inactive.");
      }

      localStorage.setItem("icms_active_student", student.id);

      const newAccount = {
        id: student.id,
        fullName: student.full_name,
        qrCode: student.qr_code,
      };
      const updatedAccounts = [
        ...savedAccounts.filter((a) => a.id !== student.id),
        newAccount,
      ];
      localStorage.setItem(
        "icms_saved_accounts",
        JSON.stringify(updatedAccounts),
      );

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to connect to the academy server.");
      setIsLoading(false);
    }
  };

  const selectProfile = (account: any) => {
    setShortId(account.qrCode);
    setSelectedName(account.fullName);
    setPin("");
    setView("login");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl shadow-black/50">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-indigo-500/30 mb-4 border border-indigo-400/30">
              IC
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Student Portal
            </h1>
            <p className="text-indigo-200 font-medium mt-1 text-sm">
              Log in to view your XP and Quests
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-sm font-bold text-red-400">{error}</p>
            </div>
          )}

          {view === "picker" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-center text-slate-300 font-bold text-sm tracking-widest uppercase mb-4">
                Who is studying?
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {savedAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => selectProfile(account)}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 group-hover:border-indigo-400 flex items-center justify-center text-xl font-black text-white shadow-lg transition-colors">
                      {getInitials(account.fullName)}
                    </div>
                    <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors text-center line-clamp-1 w-full">
                      {account.fullName.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShortId("");
                  setSelectedName("");
                  setPin("");
                  setView("login");
                }}
                className="w-full py-3 mt-4 text-sm font-bold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-500/20"
              >
                + Add Another Student
              </button>
            </div>
          )}

          {view === "login" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isScanning ? (
                <div className="space-y-4">
                  <div className="bg-white p-2 rounded-2xl overflow-hidden">
                    <div
                      id="student-qr-reader"
                      className="w-full border-none rounded-xl overflow-hidden"
                    ></div>
                  </div>
                  <button
                    onClick={() => setIsScanning(false)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors border border-slate-700"
                  >
                    Cancel Scan
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5">
                  {selectedName && (
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 mx-auto flex items-center justify-center text-2xl font-black text-white shadow-lg mb-3">
                        {getInitials(selectedName)}
                      </div>
                      <p className="text-sm text-slate-400 font-medium">
                        Welcome back,
                      </p>
                      <p className="text-xl font-black text-white">
                        {selectedName}
                      </p>
                    </div>
                  )}

                  {!selectedName && (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Short ID
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsScanning(true)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                          <span>📷</span> Scan Card
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={shortId}
                        onChange={handleShortIdChange}
                        className="w-full p-4 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-white font-mono text-lg font-bold placeholder-slate-600 transition-colors uppercase"
                        placeholder="e.g. ICMS-E-19MH06"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      4-Digit PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full p-4 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-white font-mono text-center text-3xl font-black tracking-[0.5em] placeholder-slate-700 transition-colors"
                      placeholder="••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isLoading || pin.length < 4 || shortId.length === 0
                    }
                    className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? "Authenticating..." : "Enter Portal →"}
                  </button>

                  {savedAccounts.length > 0 && (
                    <div className="pt-4 flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setView("picker")}
                        className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        Not {selectedName ? selectedName.split(" ")[0] : "you"}?{" "}
                        <span className="text-indigo-400 underline decoration-indigo-500/30 underline-offset-4">
                          Switch Account
                        </span>
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        #student-qr-reader__dashboard_section_csr span, 
        #student-qr-reader__dashboard_section_swaplink { display: none !important; }
        #student-qr-reader button { background-color: #4f46e5 !important; color: white !important; border: none !important; border-radius: 8px !important; padding: 8px 16px !important; font-weight: bold !important; margin-top: 10px !important; cursor: pointer !important; }
      `,
        }}
      />
    </div>
  );
}
