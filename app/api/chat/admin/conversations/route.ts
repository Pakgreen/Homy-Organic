import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const conversations = await Conversation.find({
      lastMessageText: { $ne: "" },
    })
      .populate("user", "name email image")
      .sort({ lastMessageTime: -1 })
      .lean();

    // Map conversations so standard guest name applies if there's no user object
    const mapped = conversations.map((conv: any) => ({
      ...conv,
      isGuest: !conv.user && !!conv.guestId,
      guestName: conv.guestId ? `Guest-${conv.guestId.substring(0, 5)}` : null,
    }));

    return NextResponse.json({ conversations: mapped });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching conversations" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await connectDB();
    await Message.deleteMany({ conversationId: id });
    await Conversation.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Chat deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting conversation" },
      { status: 500 },
    );
  }
}
