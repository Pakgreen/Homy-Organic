import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    id?: string;
    sessionVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      sessionVersion?: number;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    sessionVersion?: number;
  }
}
