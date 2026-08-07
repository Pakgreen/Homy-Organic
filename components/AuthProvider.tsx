"use client";

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';

function SessionGuard({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.error === "SessionTerminated") {
      signOut({ callbackUrl: "/auth/signin" });
    }
  }, [session]);

  return <>{children}</>;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={15} refetchOnWindowFocus={true}>
      <SessionGuard>{children}</SessionGuard>
    </SessionProvider>
  );
}
