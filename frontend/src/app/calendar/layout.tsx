/*
 * Title: Layout of the calendar
 * Description: Layout for the calendar
 * Author: Ankon Roy
 * Date: 18-02-2025
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | ScholrFlow",
  description: "Best in the East & West",
};

// app/layout.tsx
import { Calendar, Home, Settings } from "lucide-react";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">My Calendar</h1>
        <nav className="space-y-2">
          <Link href="/" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md">
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/calendar" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md">
            <Calendar className="w-5 h-5" />
            <span>Calendar</span>
          </Link>
          <Link href="/settings" className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded-md">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}