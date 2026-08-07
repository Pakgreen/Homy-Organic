"use client";

import React from "react";
import { FiAlertTriangle, FiLoader } from "react-icons/fi";

interface AdminDeleteModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function AdminDeleteModal({
  isOpen,
  title = "Confirm Delete",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  isDeleting = false,
  onConfirm,
  onClose,
}: AdminDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <FiAlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Permanent Action
            </p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-gray-600 font-normal bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70 leading-relaxed space-y-1">
          <p>{description}</p>
          {itemName && (
            <p className="pt-1">
              Item: <strong className="text-gray-900 font-bold">&quot;{itemName}&quot;</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-full border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isDeleting ? (
              <>
                <FiLoader className="animate-spin" size={15} />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Yes, Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
