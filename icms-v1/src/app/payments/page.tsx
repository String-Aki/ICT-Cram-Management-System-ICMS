"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import SNT from "@/components/StudentNameTransformer";

export default function PaymentHub() {
  const [dueStudents, setDueStudents] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Financial Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  // Search filter for the master ledger
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [paymentModal, setPaymentModal] = useState<any | null>(null);
  const [amount, setAmount] = useState("2500"); 
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setIsLoading(true);

    const { data: dueData } = await supabase
      .from("students")
      .select("id, full_name, grade_batch, qr_code, cycle_classes")
      .eq("is_active", true)
      .gte("cycle_classes", 8)
      .order("cycle_classes", { ascending: false });

    if (dueData) setDueStudents(dueData);

    const { data: ledgerData } = await supabase
      .from("payments")
      .select(`
        id, amount, paid_at, notes,
        student:student_id ( full_name, grade_batch, qr_code )
      `)
      .order("paid_at", { ascending: false });

    if (ledgerData) {
      setLedger(ledgerData);

      const currentMonthString = new Date().toISOString().slice(0, 7); 
      
      let total = 0;
      let monthly = 0;

      ledgerData.forEach((payment) => {
        const amt = Number(payment.amount) || 0;
        total += amt;
        if (payment.paid_at.startsWith(currentMonthString)) {
          monthly += amt;
        }
      });

      setTotalRevenue(total);
      setMonthlyRevenue(monthly);
    }

    setIsLoading(false);
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { error: insertError } = await supabase.from("payments").insert([{
        student_id: paymentModal.id,
        amount: parseFloat(amount),
        payment_month: today,
        notes: notes || "Cycle Payment"
      }]);

      if (insertError) throw insertError;

      const updatedCycle = Math.max(0, paymentModal.cycle_classes - 8);

      const { error: updateError } = await supabase
        .from("students")
        .update({ cycle_classes: updatedCycle })
        .eq("id", paymentModal.id);

      if (updateError) throw updateError;

      setPaymentModal(null);
      setNotes("");
      fetchFinancials();

    } catch (error: any) {
      console.error("Payment failed:", error);
      alert("Failed to process payment. Check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredLedger = ledger.filter(payment => {
    const studentName = payment.student?.full_name?.toLowerCase() || "";
    const studentId = payment.student?.qr_code?.toLowerCase() || "";
    const noteText = payment.notes?.toLowerCase() || "";
    const search = searchQuery.toLowerCase();
    
    return studentName.includes(search) || studentId.includes(search) || noteText.includes(search);
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      
      {/* --- PAYMENT MODAL --- */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Collect Fee</h2>
                <p className="text-sm font-bold text-slate-500 mt-1">{SNT(paymentModal.full_name)} • Grade {paymentModal.grade_batch}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6 flex justify-between items-center">
              <span className="text-red-800 font-bold text-sm">Classes Attended</span>
              <span className="text-xl font-black text-red-600 font-mono">{paymentModal.cycle_classes}</span>
            </div>

            <form onSubmit={processPayment} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Amount Paid (LKR)</label>
                <input 
                  type="number" 
                  required 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-xl font-black text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes (Optional)</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid in cash, late fee added..."
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-700"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setPaymentModal(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-emerald-100">
              💳
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial Dashboard</h1>
              <p className="text-slate-500 font-medium mt-1">Manage cycle billing, track revenue, and view transaction history.</p>
            </div>
          </div>
          <button onClick={fetchFinancials} className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
            ↻ Sync Financials
          </button>
        </header>

        {/* FINANCIAL ANALYTICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl border border-emerald-100">📈</div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">This Month's Revenue</span>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-black text-emerald-600 font-mono tracking-tight">Rs {monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center text-2xl border border-blue-100">🏦</div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">All-Time Revenue</span>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-black text-slate-800 font-mono tracking-tight">Rs {totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-red-50 flex items-center justify-center text-2xl border border-red-100">⚠️</div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Pending Collections</span>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-black text-red-600 font-mono tracking-tight">{dueStudents.length} Students</p>
            </div>
          </div>
        </div>

        {/* ACTION NEEDED BOARD */}
        {dueStudents.length > 0 && (
          <div className="bg-red-50/50 p-6 md:p-8 rounded-3xl border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-black text-slate-800">Action Needed: Pending Cycles</h2>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider animate-pulse">{dueStudents.length} DUE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {dueStudents.map((student) => (
                <div key={student.id} className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                  
                  <div className="flex justify-between items-start mb-5 pl-2">
                    <div>
                      <h3 className="font-black text-slate-800 text-lg line-clamp-1">{SNT(student.full_name)}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Grade {student.grade_batch}</p>
                    </div>
                    <div className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-100 font-mono text-sm font-black text-center ml-2 shrink-0">
                      {student.cycle_classes} <span className="text-[9px] block leading-none opacity-70">CLASSES</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setPaymentModal(student)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    <span>Collect Fee</span> <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
            <div>
              <h3 className="text-xl font-black text-slate-800">Financial Ledger</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Complete history of all recorded transactions.</p>
            </div>
            <input 
              type="text" 
              placeholder="Search student, ID, or notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 p-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 shadow-sm font-medium"
            />
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
               <div className="p-16 text-center animate-pulse text-slate-400 font-bold text-lg">Loading financial records...</div>
            ) : filteredLedger.length === 0 ? (
               <div className="p-16 text-center text-slate-400 font-medium">No transactions found matching your search.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                    <th className="p-5 font-bold whitespace-nowrap">Date & Time</th>
                    <th className="p-5 font-bold">Student</th>
                    <th className="p-5 font-bold">Student ID</th>
                    <th className="p-5 font-bold w-1/3">Transaction Notes</th>
                    <th className="p-5 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLedger.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      
                      <td className="p-5 whitespace-nowrap">
                        <p className="font-bold text-slate-700">
                          {new Date(payment.paid_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">
                          {new Date(payment.paid_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                        </p>
                      </td>
                      
                      <td className="p-5">
                        <p className="font-bold text-slate-800 text-base">{SNT(payment.student?.full_name || "Unknown")}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Grade {payment.student?.grade_batch}</p>
                      </td>

                      <td className="p-5">
                         <span className="bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold border border-slate-200 whitespace-nowrap">
                           {payment.student?.qr_code || "N/A"}
                         </span>
                      </td>
                      
                      <td className="p-5">
                        <div className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium whitespace-normal min-w-[200px]">
                          {payment.notes}
                        </div>
                      </td>
                      
                      <td className="p-5 text-right">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg font-mono font-black text-base whitespace-nowrap">
                          + {Number(payment.amount).toLocaleString()}
                        </span>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}