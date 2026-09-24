"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Plus, Sparkles, Menu, X, MessageSquare } from "lucide-react";
import { FeedbackModal } from "@/components/FeedbackModal";

interface NavbarProps {
  isDashboard?: boolean;
}

export default function Navbar({ isDashboard = false }: NavbarProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07080e]/90 backdrop-blur-2xl transition-colors">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <div className="w-full h-full bg-[#0c0f18] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            AI Career <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent font-extrabold">OS</span>
          </span>
        </Link>

        {/* Center: Floating Dock Navigation Links */}
        {!isDashboard && (
          <nav className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner shadow-white/[0.02]">
            <a
              href="#how-it-works"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              How It Works
            </a>
            <a
              href="#features-cockpit"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              System Engine
            </a>
            <a
              href="#tracks"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              Role Tracks
            </a>
            <a
              href="#comparison"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              Why It Works
            </a>
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Global Feedback Trigger */}
          <button
            onClick={() => setFeedbackOpen(true)}
            className="h-9 px-3 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
            title="Send Feedback"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Feedback</span>
          </button>

          {isDashboard ? (
            <>
              <button
                onClick={() => router.push("/onboarding")}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Analysis</span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="h-9 px-3.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="h-9 px-3.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="h-9 px-3.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center gap-1"
              >
                <span>Get Started</span>
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          {!isDashboard && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {!isDashboard && mobileMenuOpen && (
        <div className="lg:hidden w-full border-t border-white/[0.08] bg-[#0c0f18]/95 backdrop-blur-2xl px-5 py-4 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm text-slate-300">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href="#features-cockpit"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              System Engine
            </a>
            <a
              href="#tracks"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              Role Tracks
            </a>
            <a
              href="#comparison"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              Why It Works
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setFeedbackOpen(true);
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors flex items-center gap-2 text-indigo-300"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Send Feedback</span>
            </button>
          </nav>
        </div>
      )}

      {/* Global Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </header>
  );
}
