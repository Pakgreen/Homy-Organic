import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = req.headers.get("x-guest-id");

    if (!session?.user && !guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("id");

    if (!messageId)
      return NextResponse.json(
        { error: "Message ID required" },
        { status: 400 },
      );

    await connectDB();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    const senderIdentifier = userId || guestId;

    const message = await Message.findById(messageId);
    if (!message)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Allow user to delete their own, or admin to delete any
    if (
      role !== "admin" &&
      String(message.senderId) !== String(senderIdentifier)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (message.image) {
      // Delete from Cloudinary
      await deleteFromCloudinary(message.image);
    }

    message.isDeleted = true;
    message.text = "This message was deleted";
    message.image = "";
    await message.save();

    // To totally discard from UI
    await Message.findByIdAndDelete(messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting message" },
      { status: 500 },
    );
  }
}
