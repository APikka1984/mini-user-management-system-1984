"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("user");
    if (!raw) {
      setUser(null);
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || undefined
          : undefined;

      if (token) {
        await apiFetch<{ message: string }>(
          "/api/auth/logout",
          { method: "POST" },
          token
        );
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      router.push("/login");
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    // No navbar when logged out
    return null;
  }

  return (
    <nav className="flex items-center justify-between bg-slate-900 px-6 py-3 text-sm text-slate-100">
      <div className="flex items-center gap-4">
        <span className="font-semibold">Mini User Management</span>
        <Link
          href="/profile"
          className={
            pathname === "/profile" ? "underline" : "hover:underline"
          }
        >
          Profile
        </Link>
        {user.role === "admin" && (
          <Link
            href="/dashboard"
            className={
              pathname === "/dashboard" ? "underline" : "hover:underline"
            }
          >
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span>
          {user.fullName} ({user.role})
        </span>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </nav>
  );
}
