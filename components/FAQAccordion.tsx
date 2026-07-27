"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function FAQAccordion() {
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    axios
      .get("/api/settings/faq")
      .then((res) => {
        setFaqs(res.data || []);
      })
      .catch(console.error);
  }, []);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-4 pb-16">
      <div className="mb-2 tracking-wide text-center flex flex-col items-center">
        <h2 className="text-3xl font-light text-gray-900 mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-500 font-light text-base max-w-md">
          Everything you need to know about our products and services.
        </p>
      </div>
      <div className="border border-gray-100 bg-transparent rounded-2xl px-4 sm:px-6 mt-8 divide-y divide-gray-100">
        {faqs.map((faq, index) => (
          <div key={index} className="group">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex justify-between items-center py-5 text-left font-medium text-gray-900 cursor-pointer focus:outline-none"
            >
              <span className="text-lg pr-4 md:pr-10 max-w-[90%] leading-relaxed">
                {faq.question}
              </span>
              <span className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0">
                {openIndex === index ? (
                  <FiChevronUp size={20} />
                ) : (
                  <FiChevronDown size={20} />
                )}
              </span>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                openIndex === index
                  ? "max-h-[500px] opacity-100 mb-4"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="text-gray-500 font-light leading-relaxed pr-8 break-words text-sm sm:text-base">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
