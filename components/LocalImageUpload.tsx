"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  FiUpload,
  FiX,
  FiLoader,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import axios from "axios";

import { toast } from "sonner";

interface LocalImageUploadProps {
  value?: string;
  onChange?: (value: string) => void;
  onRemove?: () => void;
  className?: string;
  hideReplaceBadge?: boolean;
  folder?: string;
  onUpload?: (url: string) => void; // for backwards compatibility
}

export default function LocalImageUpload(props: LocalImageUploadProps) {
  const {
    value,
    onChange,
    onRemove,
    className = "w-full h-64",
    hideReplaceBadge = false,
    onUpload,
  } = props;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeErrorModal, setSizeErrorModal] = useState<{
    show: boolean;
    fileName: string;
    fileSizeMB: string;
  }>({
    show: false,
    fileName: "",
    fileSizeMB: "",
  });

  const handleUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 3MB)
    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setSizeErrorModal({
        show: true,
        fileName: file.name,
        fileSizeMB,
      });
      toast.error(`Image size (${fileSizeMB}MB) exceeds 3MB limit!`, { duration: 5000 });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (props.folder) {
        formData.append("folder", props.folder);
      }

      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      const imageUrl = response.data.url;
      if (onChange) onChange(imageUrl);
      if (onUpload) onUpload(imageUrl);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMsg = error.response?.data?.error || "Failed to upload image";
      alert(`Upload failed: ${errorMsg}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUpload(file);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        await handleUpload(file);
      }
    },
    [],
  );

  const handleRemove = async () => {
    if (value) {
      try {
        await axios.delete(`/api/upload?url=${encodeURIComponent(value)}`);
      } catch (error) {
        console.error("Failed to delete image from Cloudinary", error);
      }
    }
    if (onRemove) {
      onRemove();
    } else if (onChange) {
      onChange(""); // fallback if no onRemove provided
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-2">
        {value ? (
          <div
            className={`relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center ${className}`}
          >
            <Image
              src={value}
              alt="Upload"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={value.includes("res.cloudinary.com")}
              className="object-cover"
            />
            {(onRemove || onChange) && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 bg-white/90 text-gray-700 p-1.5 rounded-full hover:bg-white shadow text-xs cursor-pointer"
              >
                <FiX />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-2">
                <FiLoader className="text-2xl animate-spin" />
                <span className="text-[10px] sm:text-xs">
                  Uploading... {uploadProgress}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <label
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition cursor-pointer bg-gradient-to-br p-2 from-gray-50 to-white overflow-hidden relative ${className} ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-500"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                <FiLoader className="text-2xl text-blue-500 mb-1 animate-spin" />
                <span className="text-[10px] sm:text-xs text-gray-600 font-medium">
                  {uploadProgress}%
                </span>
                <div className="w-3/4 max-w-[100px] h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-1 text-gray-600 text-xs text-center w-full">
                  <FiUpload className="text-base sm:text-xl mb-1 text-gray-400" />
                  <span className="leading-tight px-1 break-words">
                    Click / Drop
                  </span>
                </div>
              </>
            )}
          </label>
        )}

        {value && !isUploading && !hideReplaceBadge && (
          <div className="flex items-center gap-2 justify-between flex-wrap">
            <label className="btn btn-sm cursor-pointer text-xs p-1.5 border rounded shadow-sm hover:bg-gray-50 bg-white">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FiUpload className="mr-1 inline" />
              Replace
            </label>
            <div className="flex items-center text-green-600 text-[10px] font-semibold whitespace-nowrap truncate">
              <FiCheckCircle className="mr-0.5 inline" /> Uploaded
            </div>
          </div>
        )}
      </div>

      {/* Custom Size Limit Exceeded Modal Popup */}
      {sizeErrorModal.show && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => setSizeErrorModal({ show: false, fileName: "", fileSizeMB: "" })}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-2xs">
              <FiAlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                File Size Limit Exceeded!
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Image size <span className="font-bold text-red-600">({sizeErrorModal.fileSizeMB} MB)</span> exceeds the <span className="font-bold text-gray-900">3MB</span> maximum limit.
              </p>
              <p className="text-[11px] text-gray-400 font-normal">
                Please compress or decrease the image resolution before uploading.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSizeErrorModal({ show: false, fileName: "", fileSizeMB: "" })}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
