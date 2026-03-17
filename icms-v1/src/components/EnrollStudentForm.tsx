"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function EnrollStudentForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [gradeBatch, setGradeBatch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("Enrolling student...");

    const shortId =
      "ITMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { data, error } = await supabase
        .from("students")
        .insert([
          {
            full_name: fullName,
            grade_batch: gradeBatch,
            qr_code: shortId,
          },
        ])
        .select();

      if (error) throw error;

      // 3. Success!
      setStatusMessage(
        `✅ Successfully enrolled ${fullName}! QR Code: ${shortId}`,
      );
      setFullName("");
      setGradeBatch("");
      router.refresh();

      // TODO: We will trigger the ID Card PDF generation here next!
    } catch (error: any) {
      console.error(error);
      setStatusMessage(
        `❌ Error: ${error?.message || "Failed to enroll student"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Admission</h2>

      <form onSubmit={handleEnrollment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g. Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade / Batch
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g. 2026 - A Level Physics"
            value={gradeBatch}
            onChange={(e) => setGradeBatch(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full p-3 text-white font-bold rounded-lg transition-all ${
            isSubmitting
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "Processing..." : "Enroll Student"}
        </button>
      </form>

      {statusMessage && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm text-center ${statusMessage.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}
