import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size should be less than 10MB" },
        { status: 400 },
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    let uploadResponse;
    const body = formData.get("folder");
    const destFolder = body ? (body as string).trim() : "xenzoxmart";

    uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: destFolder, // Optional: organize images in folder
      resource_type: "auto",
    });

    console.log("✅ Image uploaded successfully:", uploadResponse.secure_url);

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to upload image",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 },
      );
    }

    // Extract public ID from Cloudinary URL
    // Typical format: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<folder>/<public_id>.<ext>
    const urlParts = url.split("/");
    const fileWithExtension = urlParts[urlParts.length - 1];
    const fileWithoutExtension = fileWithExtension.split(".")[0];

    // Check if it's in a folder (like 'xenzoxmart')
    const folderIndex = urlParts.findIndex((part) => part === "upload") + 2; // +1 for version, +2 for folder
    const hasFolder = folderIndex < urlParts.length - 1;

    let publicId = fileWithoutExtension;
    if (hasFolder) {
      const folderName = urlParts
        .slice(folderIndex, urlParts.length - 1)
        .join("/");
      publicId = `${folderName}/${fileWithoutExtension}`;
    }

    // Attempt to delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    console.log(`✅ Image deleted from Cloudinary: ${publicId}`, result);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("❌ Delete error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete image" },
      { status: 500 },
    );
  }
}
