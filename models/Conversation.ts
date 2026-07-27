import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  user?: mongoose.Types.ObjectId;
  guestId?: string;
  admin?: mongoose.Types.ObjectId; // Optional if you have multiple admins or just 1 generic admin. We'll leave it simple.
  lastMessageText: string;
  lastMessageTime: Date;
  unreadCount: number;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
      unique: true,
    },
    guestId: {
      type: String,
      sparse: true,
      unique: true,
    },
    // If you want a specific admin assigned:
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastMessageText: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
