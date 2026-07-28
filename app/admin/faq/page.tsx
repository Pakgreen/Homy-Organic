"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiPlus, FiTrash2, FiSave, FiMenu, FiHelpCircle, FiArrowUp, FiArrowDown } from "react-icons/fi";

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    axios
      .get("/api/settings/faq")
      .then((res) => setFaqs(res.data || []))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load FAQs");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleFAQChange = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const addFAQ = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const moveFAQ = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;
    const updated = [...faqs];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    setFaqs(updated);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newFaqs = [...faqs];
    const draggedItem = newFaqs[draggedIndex];
    newFaqs.splice(draggedIndex, 1);
    newFaqs.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setFaqs(newFaqs);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const saveFAQs = async () => {
    setIsSaving(true);
    try {
      const validFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
      await axios.put("/api/settings/faq", validFaqs);
      setFaqs(validFaqs);
      toast.success("FAQs updated successfully");
    } catch (error) {
      console.error("Save FAQs error:", error);
      toast.error("Failed to save FAQs");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-8 w-36 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Manage FAQs</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add and reorder frequently asked questions</p>
          </div>
          {faqs.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full text-white" style={{ backgroundColor: "#B9853A" }}>
              {faqs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addFAQ}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-all cursor-pointer"
          >
            <FiPlus size={15} />
            <span>Add FAQ</span>
          </button>
          <button
            onClick={saveFAQs}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: "#B9853A" }}
            onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = "#a07230")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#B9853A")}
          >
            <FiSave size={15} />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {faqs.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF6EC] flex items-center justify-center mb-4">
            <FiHelpCircle size={24} style={{ color: "#B9853A" }} />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No FAQs added yet</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            Create questions and answers to help customers understand your services.
          </p>
          <button
            onClick={addFAQ}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer"
            style={{ backgroundColor: "#B9853A" }}
          >
            Add First Question
          </button>
        </div>
      )}

      {/* FAQ List */}
      {faqs.length > 0 && (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              className={`group bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex gap-3 sm:gap-4 transition-all ${
                draggedIndex === index ? "opacity-30 border-dashed border-[#B9853A]" : "hover:border-gray-200 hover:shadow-sm"
              }`}
            >
              {/* Drag handle & Index badge */}
              <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                <div
                  className="p-1 rounded text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors hidden sm:block"
                  title="Drag to reorder"
                >
                  <FiMenu size={18} />
                </div>

                {/* Mobile reorder buttons */}
                <div className="flex flex-col gap-0.5 sm:hidden">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveFAQ(index, "up")}
                    className="p-1 text-gray-400 hover:text-black disabled:opacity-20 cursor-pointer"
                  >
                    <FiArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={index === faqs.length - 1}
                    onClick={() => moveFAQ(index, "down")}
                    className="p-1 text-gray-400 hover:text-black disabled:opacity-20 cursor-pointer"
                  >
                    <FiArrowDown size={14} />
                  </button>
                </div>

                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                  #{index + 1}
                </span>
              </div>

              {/* Question & Answer Inputs */}
              <div className="flex-1 space-y-3 min-w-0">
                {/* Question */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Question <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-gray-400 font-normal">
                      {faq.question?.length || 0}/120
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    value={faq.question}
                    onChange={(e) => handleFAQChange(index, "question", e.target.value)}
                    placeholder="e.g. What are your delivery charges?"
                    className="w-full px-3.5 py-2 text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300"
                  />
                </div>

                {/* Answer */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Answer <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-gray-400 font-normal">
                      {faq.answer?.length || 0}/400
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={400}
                    value={faq.answer}
                    onChange={(e) => handleFAQChange(index, "answer", e.target.value)}
                    placeholder="Write a clear and helpful answer..."
                    className="w-full px-3.5 py-2 text-sm text-gray-800 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#B9853A] focus:bg-white transition-all placeholder:text-gray-300 resize-y"
                  />
                </div>
              </div>

              {/* Remove button */}
              <div className="shrink-0 pt-1">
                <button
                  type="button"
                  onClick={() => removeFAQ(index)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove FAQ"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Bottom Add & Save action bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={addFAQ}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-400 rounded-xl transition-all cursor-pointer"
            >
              <FiPlus size={16} />
              Add Another Question
            </button>
            <button
              onClick={saveFAQs}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: "#B9853A" }}
              onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = "#a07230")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#B9853A")}
            >
              <FiSave size={16} />
              <span>{isSaving ? "Saving..." : "Save All FAQs"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
