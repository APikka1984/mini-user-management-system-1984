"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface MeResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: "user" | "admin";
    status: "active" | "inactive";
    lastLogin?: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const data = await apiFetch<MeResponse>(
          "/api/auth/me",
          { method: "GET" },
          token
        );

        setMe(data.user);
        setError(null);

        // keep local copy in sync for navbar / guards
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data.user.id,
            fullName: data.user.fullName,
            email: data.user.email,
            role: data.user.role,
          })
        );
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600 text-sm">Loading profile...</p>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-red-600 text-sm">
          {error || "Profile not available"}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-start justify-center bg-slate-100">
      <div className="mt-12 w-full max-w-lg rounded-lg bg-white p-8 shadow text-black">
        <h1 className="mb-6 text-2xl font-semibold">My Profile</h1>

        {error && (
          <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="font-medium text-slate-500">Full name</dt>
            <dd className="text-slate-900">{me.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-slate-500">Email</dt>
            <dd className="text-slate-900">{me.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-slate-500">Role</dt>
            <dd className="capitalize text-slate-900">{me.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-slate-500">Status</dt>
            <dd>
              <span
                className={
                  me.status === "active"
                    ? "rounded bg-green-100 px-2 py-1 text-xs text-green-700"
                    : "rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                }
              >
                {me.status}
              </span>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-slate-500">Last login</dt>
            <dd className="text-xs text-slate-500">
              {me.lastLogin
                ? new Date(me.lastLogin).toLocaleString()
                : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
