// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "./Navbar";

export const metadata: Metadata = {
  title: "Mini User Management",
  description: "Assessment app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100">
        <Navbar />
        {/* Push all pages (including signup) below navbar */}
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}
