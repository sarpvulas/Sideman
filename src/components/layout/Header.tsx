"use client";

import Link from "next/link";
import { Music, HelpCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-primary-900/80 backdrop-blur-lg border-b border-primary-800",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-accent-gold flex items-center justify-center group-hover:bg-accent-gold-glow transition-colors">
              <Music className="w-6 h-6 text-primary-900" />
            </div>
            <span className="text-xl font-display font-bold text-primary-100">
              Jazz Piano Teacher
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-primary-300 hover:text-primary-100 transition-colors text-sm font-medium"
            >
              Upload
            </Link>
            <Link
              href="/progress"
              className="text-primary-300 hover:text-primary-100 transition-colors text-sm font-medium"
            >
              Progress
            </Link>
            <button
              className="p-2 text-primary-400 hover:text-primary-100 hover:bg-primary-800 rounded-lg transition-colors"
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
