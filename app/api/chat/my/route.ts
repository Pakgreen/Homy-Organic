import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = req.headers.get("x-guest-id");

    if (!session?.user && !guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = session?.user?.id;

    let conversation;
    if (userId) {
      conversation = await Conversation.findOne({ user: userId });
      if (!conversation) {
        conversation = await Conversation.create({ user: userId });
      }
    } else {
      conversation = await Conversation.findOne({ guestId: guestId as string });
      if (!conversation) {
        conversation = await Conversation.create({
          guestId: guestId as string,
        });
      }
    }

    const messages = await Message.find({
      conversationId: conversation._id,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    return NextResponse.json({ conversation, messages });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Error fetching chat",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = req.headers.get("x-guest-id");

    if (!session?.user && !guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, image } = await req.json();
    await connectDB();

    const userId = session?.user?.id;
    const senderId = userId || guestId;

    let conversation;
    if (userId) {
      conversation = await Conversation.findOne({ user: userId });
      if (!conversation) {
        conversation = await Conversation.create({ user: userId });
      }
    } else {
      conversation = await Conversation.findOne({ guestId: guestId as string });
      if (!conversation) {
        conversation = await Conversation.create({
          guestId: guestId as string,
        });
      }
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: senderId as string,
      senderModel: "User",
      text,
      image,
    });

    conversation.lastMessageText = text || "Image";
    conversation.lastMessageTime = new Date();
    await conversation.save();

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Error sending message",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
