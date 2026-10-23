"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import Link from "next/link";
import { Lock, LogIn } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        setIsAuthenticated(Boolean(d.authenticated && d.user));
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />
      {isAuthenticated === false && (
        <div className="bg-blue-950/80 border-b border-blue-800/80 px-4 py-2 text-xs text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-blue-400" />
            <span>Operational Console Preview Mode — No authenticated operator session detected.</span>
          </div>
          <Link
            href="/"
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
          >
            <LogIn className="h-3 w-3" />
            <span>Sign In</span>
          </Link>
        </div>
      )}
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
