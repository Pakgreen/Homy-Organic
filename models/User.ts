import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "moderator" | "manager" | "support";
  permissions?: string[];
  avatar?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  lastLogin?: Date;
  lastActive?: Date;
  lastIp?: string;
  lastDevice?: string;
  sessionVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 4,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator", "manager", "support"],
      default: "user",
    },
    permissions: [
      {
        type: String,
        enum: [
          "manage_products",
          "manage_orders",
          "manage_categories",
          "manage_users",
          "manage_settings",
          "manage_sliders",
          "manage_banners",
          "manage_faq",
          "manage_footer",
          "view_analytics",
          "manage_moderators",
        ],
      },
    ],
    avatar: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastActive: {
      type: Date,
      default: null,
    },
    lastIp: {
      type: String,
      default: null,
    },
    lastDevice: {
      type: String,
      default: null,
    },
    sessionVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
