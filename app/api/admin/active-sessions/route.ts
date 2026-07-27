import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Fetch users who have logged in recently, sorted by lastLogin
    const activeUsers = await User.find({ lastLogin: { $ne: null } })
      .select("name email role lastLogin lastActive lastIp lastDevice")
      .sort({ lastLogin: -1 })
      .limit(50); // Get latest 50 logins

    return NextResponse.json(activeUsers);
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch active sessions" },
      { status: 500 },
    );
  }
}
