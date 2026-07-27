"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

interface ActiveUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  lastActive: string;
  lastIp: string;
  lastDevice: string;
}

export default function ActiveSessionsPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveUsers();
  }, []);

  const fetchActiveUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/active-sessions");
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to load active users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to terminate this user's session? They will be logged out immediately.",
      )
    )
      return;

    try {
      // Optimistic update: temporarily remove or mark the user visually.
      // But a clean refresh is safer since we have no complex state machine.
      await axios.post("/api/admin/active-sessions/terminate", { userId });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      alert("Session terminated successfully.");
    } catch (error) {
      console.error("Failed to terminate session", error);
      alert("Failed to terminate session.");
    }
  };

  const getDeviceName = (userAgent: string | undefined) => {
    if (!userAgent) return "Unknown";
    // Very basic parsing for display
    if (userAgent.includes("Windows")) return "Windows OS";
    if (userAgent.includes("Mac")) return "Mac OS";
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("Android")) return "Android Device";
    if (userAgent.includes("Linux")) return "Linux OS";
    return "Other Device";
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end pb-8 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">
            Active Sessions
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-light">
            Monitor recent logins and active devices
          </p>
        </div>
        <button
          onClick={fetchActiveUsers}
          className="text-sm font-medium text-gray-400 cursor-pointer hover:text-black transition-colors pb-1 border-b border-transparent hover:border-black"
        >
          Refresh Data
        </button>
      </div>

      <div className="w-full overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-4 pr-6 text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Login Time
                </th>
                <th className="pb-4 px-6 text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  IP Address
                </th>
                <th className="pb-4 pl-6 text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Device / Browser
                </th>
                <th className="pb-4 pr-6 text-right text-xs font-semibold text-gray-900 uppercase tracking-widest">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center text-sm font-light text-gray-500"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center text-sm font-light text-gray-500"
                  >
                    No active sessions found.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isCurrentSession = session?.user?.email === user.email;

                  return (
                    <tr
                      key={user._id}
                      className="group transition-colors border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30"
                    >
                      <td className="py-5 pr-6 whitespace-nowrap text-sm text-gray-900 font-light">
                        <div className="flex flex-col gap-1.5">
                          <span>
                            {new Date(user.lastLogin).toLocaleString()}
                          </span>
                          {isCurrentSession && (
                            <span className="inline-flex items-center px-1.5 py-0.5 border border-gray-900 text-[10px] font-medium text-gray-900 w-fit">
                              CURRENT ({user.name})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6 whitespace-nowrap text-sm font-mono text-gray-500 tracking-tight">
                        {user.lastIp || "Unknown"}
                      </td>
                      <td className="py-5 pl-6 text-sm text-gray-900 font-light">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-gray-800">
                            {getDeviceName(user.lastDevice)}
                          </span>
                          <span
                            className="text-xs text-gray-400 truncate max-w-[200px]"
                            title={user.lastDevice}
                          >
                            {user.lastDevice || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 pr-6 text-right whitespace-nowrap">
                        {!isCurrentSession && (
                          <button
                            onClick={() => handleTerminateSession(user._id)}
                            className="text-xs font-medium text-red-500 hover:text-red-700 cursor-pointer px-3 py-1.5 rounded transition-colors"
                          >
                            Terminate
                          </button>
                        )}
                        {isCurrentSession && (
                          <span className="text-xs font-light text-gray-400 italic">
                            Cannot terminate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
