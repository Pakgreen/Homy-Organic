import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");

    await connectDB();
    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching messages" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, image, conversationId } = await req.json();
    await connectDB();
    const adminId = session.user.id;

    const message = await Message.create({
      conversationId,
      senderId: adminId,
      senderModel: "Admin",
      text,
      image,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageText: text || "Image",
      lastMessageTime: new Date(),
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: "Error sending message" },
      { status: 500 },
    );
  }
}
