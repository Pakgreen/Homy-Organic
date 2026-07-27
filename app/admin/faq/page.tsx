"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FiPlus, FiTrash2, FiSave, FiMenu } from "react-icons/fi";

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
    value: string,
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

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
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
      // Basic validation
      const validFaqs = faqs.filter(
        (f) => f.question.trim() && f.answer.trim(),
      );
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
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-transparent mt-10">
      <div className="flex items-center justify-between mb-12 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight">
          Manage FAQ
        </h1>
        <button
          onClick={saveFAQs}
          disabled={isSaving}
          className="px-6 py-2 bg-black text-white rounded-full flex items-center gap-2 cursor-pointer hover:bg-gray-800 transition-colors text-sm"
        >
          <FiSave />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-1 mb-10">
        {faqs.map((faq, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            className={`flex items-start gap-4 relative group border-b border-gray-100 py-5 transition-all duration-200 ${
              draggedIndex === index
                ? "opacity-30 bg-gray-50/50 rounded-xl px-2"
                : "opacity-100"
            }`}
          >
            <div
              className="flex-shrink-0 mt-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to reorder"
            >
              <FiMenu size={18} />
            </div>

            <div className="flex-grow w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  value={faq.question}
                  maxLength={40}
                  onChange={(e) =>
                    handleFAQChange(index, "question", e.target.value)
                  }
                  className="w-full pr-16 text-lg tracking-wide font-medium text-gray-900 bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder-gray-300"
                  placeholder="Question..."
                />
                <span className="absolute right-0 top-1 text-[11px] text-gray-400 font-light pointer-events-none">
                  {faq.question?.length || 0}/40
                </span>
              </div>

              <div className="relative w-full mt-2">
                <textarea
                  value={faq.answer}
                  maxLength={100}
                  onChange={(e) =>
                    handleFAQChange(index, "answer", e.target.value)
                  }
                  rows={2}
                  className="w-full pr-16 text-gray-400 text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 resize-none placeholder-gray-200"
                  placeholder="Answer..."
                />
                <span className="absolute right-0 bottom-0 text-[11px] text-gray-400 font-light pointer-events-none">
                  {faq.answer?.length || 0}/100
                </span>
              </div>
            </div>

            <button
              onClick={() => removeFAQ(index)}
              className="flex-shrink-0 mt-2 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Remove FAQ"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        ))}
        {faqs.length === 0 && (
          <div className="text-gray-400 py-10 text-center font-light">
            No FAQs added yet. Type your first question below.
          </div>
        )}
      </div>

      <div>
        <button
          onClick={addFAQ}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors cursor-pointer text-sm font-medium"
        >
          <FiPlus size={18} /> Add new question
        </button>
      </div>
    </div>
  );
}
