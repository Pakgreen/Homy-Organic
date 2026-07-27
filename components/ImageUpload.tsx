"use client";

import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { FiUpload, FiX } from "react-icons/fi";
import { isCloudinaryUrl } from "@/lib/image";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
}: ImageUploadProps) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const onUpload = (result: any) => {
    console.log("✅ Upload successful:", result.info.secure_url);
    onChange(result.info.secure_url);
  };

  const onError = (error: any) => {
    console.error("❌ Upload error:", error);
    alert(
      'Upload failed! Please check:\n1. Upload preset "ml_default" exists\n2. Signing mode is "Unsigned"\n3. Cloudinary credentials are correct',
    );
  };

  // Debug: Check if cloudName is loaded
  if (!cloudName) {
    console.error("❌ CLOUDINARY_CLOUD_NAME not found! Check .env.local");
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600 font-semibold">
          ⚠️ Cloudinary Not Configured
        </p>
        <p className="text-sm text-red-500 mt-1">
          Check .env.local file and restart server
        </p>
      </div>
    );
  }

  console.log("🔧 Cloudinary Config:", {
    cloudName,
    uploadPreset: "ml_default",
  });

  return (
    <div>
      <CldUploadWidget
        uploadPreset="ml_default"
        onSuccess={onUpload}
        onError={onError}
        options={{
          cloudName: cloudName,
          multiple: false,
          maxFiles: 1,
          maxFileSize: 4194304, // 4MB
        }}
      >
        {({ open }) => (
          <div className="space-y-4">
            {value ? (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={value}
                  alt="Upload"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized={isCloudinaryUrl(value)}
                  className="object-cover"
                />
                {onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => open()}
                className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition cursor-pointer"
              >
                <FiUpload className="text-4xl text-gray-400 mb-2" />
                <span className="text-gray-500">Click to upload image</span>
                <span className="text-sm text-gray-400 mt-1">
                  PNG, JPG, GIF up to 4MB
                </span>
              </button>
            )}

            {value && (
              <button
                type="button"
                onClick={() => open()}
                className="btn btn-secondary w-full"
              >
                <FiUpload className="mr-2" />
                Change Image
              </button>
            )}
          </div>
        )}
      </CldUploadWidget>
    </div>
  );
}
