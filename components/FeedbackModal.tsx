"use client";

import React, { useState } from "react";
import { MessageSquare, Star, X, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentRoute = "/",
}) => {
  const [type, setType] = useState<"General feedback" | "Feature request" | "Bug">("General feedback");
  const [rating, setRating] = useState<number | null>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [screenshotNote, setScreenshotNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please describe your feedback or suggestions.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          rating,
          message: message.trim(),
          email: email.trim() || undefined,
          route: typeof window !== "undefined" ? window.location.pathname : currentRoute,
          screenshotNote: screenshotNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit feedback.");
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setMessage("");
        setScreenshotNote("");
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#0e111a] border border-white/10 shadow-2xl overflow-hidden p-6 text-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close feedback modal"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-8 flex flex-col items-center text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Thanks! Your feedback was sent.</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              Your feedback was dispatched directly to sskiran961@gmail.com. We read and review every response.
            </p>
            <p className="text-[11px] text-indigo-300/90 mt-2 font-mono bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
              Want a quick call? Reply to the confirmation email or reach out anytime.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Send Feedback</h3>
                <p className="text-xs text-slate-400">Help us make AI Career OS even better</p>
              </div>
            </div>

            {/* Type Selection */}
            <div className="flex items-center gap-2">
              {(["General feedback", "Feature request", "Bug"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    type === t
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                      : "bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Star Rating */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400">Experience Rating</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (hoverRating || rating || 0) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-600 hover:scale-110 transition-transform cursor-pointer"
                      aria-label={`${star} Star`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          filled ? "text-amber-400 fill-amber-400" : "text-slate-600"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Message <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind? What can we improve, add, or fix?"
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none font-sans"
                required
              />
            </div>

            {/* Contact Email & Screenshot Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Your Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Context / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={screenshotNote}
                  onChange={(e) => setScreenshotNote(e.target.value)}
                  placeholder="e.g. On mobile Safari / step 2"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send to Team</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
