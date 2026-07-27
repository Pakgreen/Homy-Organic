import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET all staff (Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    await connectDB();

    const staff = await User.find({
      role: { $in: ["admin", "moderator", "manager", "support"] },
    }).select("name email role _id");

    return NextResponse.json({
      staff,
      count: staff.length,
    });
  } catch (error: any) {
    console.error("Get staff error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch staff",
        code: "STAFF_FETCH_ERROR",
      },
      { status: 500 },
    );
  }
}

// POST - Create new staff member (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    await connectDB();

    const data = await req.json();
    const { name, email, password, role } = data;

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error: "Name, email, and password are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    if (!["admin", "moderator", "manager", "support"].includes(role)) {
      return NextResponse.json(
        {
          error: "Invalid role",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          error: "User with this email already exists",
          code: "USER_EXISTS",
        },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    return NextResponse.json(
      {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create staff error:", error);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to create staff member";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(", ")}`;
    } else if (error?.code === 11000) {
      statusCode = 409;
      errorMessage = "Email already exists";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "STAFF_CREATE_ERROR",
      },
      { status: statusCode },
    );
  }
}
