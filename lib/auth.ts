import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET environment variable is not set");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
      },
      async authorize(credentials, req) {
        console.log("[AUTH] === AUTHORIZE CALLED ===", { 
          hasCredentials: !!credentials,
          loginType: credentials?.loginType,
          email: credentials?.email 
        });
        
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Please provide email and password");
          }

          await connectDB();

          const normalizedEmail = credentials.email.trim().toLowerCase();
          const escapedEmail = normalizedEmail.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );

          const adminEmailEnv = process.env.ADMIN_EMAIL?.trim().toLowerCase();
          const adminPasswordEnv = process.env.ADMIN_PASSWORD;

          if (credentials.loginType === "admin") {
            console.log("[AUTH] Admin login attempt for:", normalizedEmail);
            // Admin portal login attempt
            // First, try environment admin credentials (backwards compatibility)
            const adminEmailEnv = process.env.ADMIN_EMAIL?.trim().toLowerCase();
            const adminPasswordEnv = process.env.ADMIN_PASSWORD;

            if (adminEmailEnv && adminPasswordEnv && normalizedEmail === adminEmailEnv && credentials.password === adminPasswordEnv) {
              console.log("[AUTH] Matched environment admin");
              // Valid environment admin credentials
              let adminUser = await User.findOne({ email: adminEmailEnv });
              if (!adminUser) {
                const hashedPassword = await bcrypt.hash(adminPasswordEnv, 10);
                adminUser = await User.create({
                  name: "Admin",
                  email: adminEmailEnv,
                  password: hashedPassword,
                  role: "admin",
                });
              } else if (adminUser.role !== "admin") {
                await User.findByIdAndUpdate(adminUser._id, { role: "admin" });
                adminUser.role = "admin";
              }

              // Track active session
              try {
                const userAgent =
                  req?.headers?.["user-agent"] || "Unknown Device";
                const ip =
                  req?.headers?.["x-forwarded-for"] ||
                  req?.headers?.["x-real-ip"] ||
                  "Unknown IP";

                adminUser = await User.findByIdAndUpdate(
                  adminUser._id,
                  {
                    $inc: { sessionVersion: 1 },
                    lastLogin: new Date(),
                    lastActive: new Date(),
                    lastIp: ip,
                    lastDevice: userAgent,
                  },
                  { new: true },
                );
              } catch (updateErr) {
                console.error("Failed to update login tracking", updateErr);
              }

              if (!adminUser) return null;

              return {
                id: adminUser._id.toString(),
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
                sessionVersion: adminUser.sessionVersion,
              };
            }

            // Try database staff/admin login
            console.log("[AUTH] Trying database staff lookup for:", normalizedEmail);
            const staffUser = await User.findOne({
              email: { $regex: `^${escapedEmail}$`, $options: "i" },
              role: { $in: ["admin", "moderator", "manager", "support"] },
            });

            console.log("[AUTH] Staff user found:", staffUser ? { id: staffUser._id, email: staffUser.email, role: staffUser.role } : "NOT FOUND");

            if (!staffUser) {
              throw new Error("Invalid admin email");
            }

            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              staffUser.password,
            );

            console.log("[AUTH] Password valid:", isPasswordValid);

            if (!isPasswordValid) {
              throw new Error("Invalid admin password");
            }

            // Track active session
            try {
              const userAgent =
                req?.headers?.["user-agent"] || "Unknown Device";
              const ip =
                req?.headers?.["x-forwarded-for"] ||
                req?.headers?.["x-real-ip"] ||
                "Unknown IP";

              const updatedStaffUser = await User.findByIdAndUpdate(
                staffUser._id,
                {
                  $inc: { sessionVersion: 1 },
                  lastLogin: new Date(),
                  lastActive: new Date(),
                  lastIp: ip,
                  lastDevice: userAgent,
                },
                { new: true },
              );

              if (updatedStaffUser) {
                const returnUser = {
                  id: updatedStaffUser._id.toString(),
                  email: updatedStaffUser.email,
                  name: updatedStaffUser.name,
                  role: updatedStaffUser.role,
                  sessionVersion: updatedStaffUser.sessionVersion,
                };
                console.log("[AUTH] Returning staff user:", returnUser);
                return returnUser;
              }
            } catch (updateErr) {
              console.error("Failed to update login tracking", updateErr);
            }

            const returnUser = {
              id: staffUser._id.toString(),
              email: staffUser.email,
              name: staffUser.name,
              role: staffUser.role,
              sessionVersion: staffUser.sessionVersion,
            };
            console.log("[AUTH] Returning staff user (without update):", returnUser);
            return returnUser;
          } else {
            // Normal user login attempt
            if (adminEmailEnv && normalizedEmail === adminEmailEnv) {
              throw new Error("Admins must login from the admin portal");
            }

            const user = await User.findOne({
              email: { $regex: `^${escapedEmail}$`, $options: "i" },
            });

            if (!user) {
              throw new Error("No user found with this email");
            }

            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password,
            );

            if (!isPasswordValid) {
              throw new Error("Invalid password");
            }

            // Track active session for users too
            let updatedUser = user;
            try {
              const userAgent =
                req?.headers?.["user-agent"] || "Unknown Device";
              const ip =
                req?.headers?.["x-forwarded-for"] ||
                req?.headers?.["x-real-ip"] ||
                "Unknown IP";

              const updatedDoc = await User.findByIdAndUpdate(
                user._id,
                {
                  $inc: { sessionVersion: 1 },
                  lastLogin: new Date(),
                  lastActive: new Date(),
                  lastIp: ip,
                  lastDevice: userAgent,
                },
                { new: true },
              );

              if (updatedDoc) {
                updatedUser = updatedDoc;
              }
            } catch (updateErr) {
              console.error("Failed to update login tracking", updateErr);
            }

            if (!updatedUser) return null;

            return {
              id: updatedUser._id.toString(),
              email: updatedUser.email,
              name: updatedUser.name,
              role: updatedUser.role,
              sessionVersion: updatedUser.sessionVersion,
            };
          }
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("[JWT] User received:", { id: user.id, email: user.email, role: user.role });
        token.role = user.role;
        token.id = user.id;
        token.sessionVersion = user.sessionVersion; // Store session version
      }

      // Re-validate session version for existing tokens to enable session termination
      if (token.id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).select("sessionVersion");
          if (!dbUser || dbUser.sessionVersion !== token.sessionVersion) {
            throw new Error("Session Terminated");
          }
        } catch (e) {
          // If session version changed or user deleted, destroy token by returning empty object
          return { ...token, exp: 0, error: "SessionTerminated" };
        }
      }

      console.log("[JWT] Token returned:", { id: token.id, role: token.role });
      return token;
    },
    async session({ session, token }) {
      console.log("[SESSION] Token received:", { id: token.id, role: token.role });
      if (token && session.user) {
        if (token.error === "SessionTerminated") {
          // Effectively logging the user out visually if needed, but nextauth will just clear if we return null
          return null as any;
        }
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      console.log("[SESSION] Final session:", { role: session.user?.role });
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
