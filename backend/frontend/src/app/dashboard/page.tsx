"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  lastLogin?: string;
}

interface UsersResponse {
  users: User[];
  page: number;
  total: number;
  totalPages: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || undefined
          : undefined;

      const data = await apiFetch<UsersResponse>(
        "/api/users?page=1",
        { method: "GET" },
        token
      );

      setUsers(data.users);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");

    // Not logged in → login
    if (!token || !rawUser) {
      router.push("/login");
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as { role?: string };
      // Not admin → profile (or any other page you like)
      if (parsed.role !== "admin") {
        router.push("/profile");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    // Only run if checks passed
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (
    user: User,
    nextStatus: "active" | "inactive"
  ) => {
    const actionLabel = nextStatus === "active" ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${actionLabel} ${user.fullName}?`)) {
      return;
    }

    try {
      setLoadingId(user._id);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || undefined
          : undefined;

      const path =
        nextStatus === "active"
          ? `/api/users/${user._id}/activate`
          : `/api/users/${user._id}/deactivate`;

      await apiFetch<{ user: User }>(path, { method: "PATCH" }, token);

      await loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user status");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <main className="min-h-screen flex items-start justify-start bg-slate-100">
      <div className="p-8 w-full max-w-5xl text-black">
        <h1 className="mb-4 text-3xl font-bold">Dashboard</h1>

        {error && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2">Full Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Last login</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isActive = u.status === "active";
                const isLoading = loadingId === u._id;

                return (
                  <tr key={u._id} className="border-t">
                    <td className="px-4 py-2">{u.fullName}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 capitalize">{u.role}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          isActive
                            ? "rounded bg-green-100 px-2 py-1 text-xs text-green-700"
                            : "rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                        }
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      {isActive ? (
                        <button
                          disabled={isLoading}
                          onClick={() => handleStatusChange(u, "inactive")}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {isLoading ? "Updating..." : "Deactivate"}
                        </button>
                      ) : (
                        <button
                          disabled={isLoading}
                          onClick={() => handleStatusChange(u, "active")}
                          className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isLoading ? "Updating..." : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
