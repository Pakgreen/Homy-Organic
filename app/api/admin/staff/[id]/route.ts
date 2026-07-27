import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// PUT - Update staff member (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    await connectDB();

    const { id } = await params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          error: "Invalid staff ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    const data = await req.json();
    const { name, email, password, role } = data;

    const updateData: Record<string, any> = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) {
      if (!["admin", "moderator", "manager", "support"].includes(role)) {
        return NextResponse.json(
          {
            error: "Invalid role",
            code: "VALIDATION_ERROR",
          },
          { status: 400 },
        );
      }
      updateData.role = role;
    }

    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          {
            error: "Password must be at least 8 characters",
            code: "VALIDATION_ERROR",
          },
          { status: 400 },
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const staff = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("name email role _id");

    if (!staff) {
      return NextResponse.json(
        {
          error: "Staff member not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(staff);
  } catch (error: any) {
    console.error("Update staff error:", error);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to update staff member";

    if (error?.code === 11000) {
      statusCode = 409;
      errorMessage = "Email already in use";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "STAFF_UPDATE_ERROR",
      },
      { status: statusCode },
    );
  }
}

// DELETE staff member (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    await connectDB();

    const { id } = await params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        {
          error: "Invalid staff ID",
          code: "INVALID_ID",
        },
        { status: 400 },
      );
    }

    // Prevent deleting yourself
    if (session.user.id === id) {
      return NextResponse.json(
        {
          error: "Cannot delete your own account",
          code: "CANNOT_DELETE_SELF",
        },
        { status: 400 },
      );
    }

    const staff = await User.findById(id);

    if (!staff) {
      return NextResponse.json(
        {
          error: "Staff member not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // Delete staff from database
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Staff member deleted successfully",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("Delete staff error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to delete staff member",
        code: "STAFF_DELETE_ERROR",
      },
      { status: 500 },
    );
  }
}
