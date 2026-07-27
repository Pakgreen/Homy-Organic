import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import { buildWelcomeEmail, sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Validate required fields
    if (!name || !normalizedEmail || !password) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, email, password",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        {
          error: "Password must be at least 4 characters",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.findOne({
      email: { $regex: `^${escapedEmail}$`, $options: "i" },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "User already exists with this email",
          code: "USER_EXISTS",
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
    });

    // Link any previous guest orders using this email
    try {
      await Order.updateMany(
        {
          contactEmail: { $regex: `^${escapedEmail}$`, $options: "i" },
          user: { $exists: false },
        },
        { $set: { user: user._id } },
      );
    } catch (orderLinkErr) {
      console.error(
        "Error linking previous orders for new user:",
        orderLinkErr,
      );
    }

    // Run email logic in background to make response faster
    Promise.resolve(buildWelcomeEmail(name || normalizedEmail))
      .then((welcomeEmail: any) => {
        return sendEmail({
          to: normalizedEmail,
          subject: welcomeEmail.subject,
          html: welcomeEmail.html,
        });
      })
      .catch((emailError: any) => {
        console.error("Welcome email error:", emailError);
      });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    let statusCode = 500;
    let errorMessage = error?.message || "Failed to register user";

    if (error?.name === "ValidationError") {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(", ")}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: "REGISTRATION_ERROR",
        details:
          process.env.NODE_ENV === "development"
            ? error?.toString()
            : undefined,
      },
      { status: statusCode },
    );
  }
}
