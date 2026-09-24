"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AssessmentSessionGuard,
  generateDeviceId,
  scrubClipboard,
} from "@/lib/assessmentSecurity";

interface AssessmentDrmGuardProps {
  assessmentId: string;
  assessmentTitle?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * AssessmentDrmGuard (Silent Background DRM Security)
 * 
 * Runs silently in the background without showing any upfront banners,
 * badges, or toasts to the user.
 * 
 * - Seamlessly permits tab switching without failing or breaking the quiz.
 * - Instantly displays a 100% pitch-black screen (Netflix-grade DRM) if a
 *   screenshot, screen capture, DevTools, or second-device answering attempt is made.
 * - Scrubs OS clipboard automatically.
 * - Enforces print/PDF blackout (@media print).
 */
export default function AssessmentDrmGuard({
  assessmentId,
  assessmentTitle = "Technical Assessment",
  children,
  className = "",
}: AssessmentDrmGuardProps) {
  // Pure black screen state (like Netflix DRM)
  const [isBlackout, setIsBlackout] = useState(false);
  const [blackoutCooldown, setBlackoutCooldown] = useState(0);
  const [deviceInstanceId] = useState<string>(() => generateDeviceId());

  // Trigger instant Netflix DRM Blackout
  const triggerBlackout = useCallback(async () => {
    setIsBlackout(true);
    setBlackoutCooldown(3); // 3-second blackout duration
    await scrubClipboard();
  }, []);

  // Cooldown timer to restore screen once safe
  useEffect(() => {
    if (blackoutCooldown > 0 && isBlackout) {
      const timer = setTimeout(() => {
        setBlackoutCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (blackoutCooldown === 0 && isBlackout) {
      setIsBlackout(false);
    }
  }, [blackoutCooldown, isBlackout]);

  // 1. Cross-Device / Multi-Session Background Guard
  useEffect(() => {
    const guard = new AssessmentSessionGuard(assessmentId, deviceInstanceId);
    guard.setConflictHandler(() => {
      triggerBlackout();
    });

    return () => {
      guard.destroy();
    };
  }, [assessmentId, deviceInstanceId, triggerBlackout]);

  // 2. Silent Screenshot & Screen Recording Key Interceptors
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // PrintScreen Key
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44
      ) {
        e.preventDefault();
        await scrubClipboard();
        triggerBlackout();
        return false;
      }

      // Windows Snipping Tool: Win + Shift + S or Ctrl + Shift + S
      if (
        (e.key === "S" || e.key === "s") &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        await scrubClipboard();
        triggerBlackout();
        return false;
      }

      // Mac Screenshot Shortcuts: Cmd + Shift + 3, 4, 5, 6
      if (
        e.metaKey &&
        e.shiftKey &&
        ["3", "4", "5", "6", "KeyS"].includes(e.code || e.key)
      ) {
        e.preventDefault();
        await scrubClipboard();
        triggerBlackout();
        return false;
      }

      // Print / Save to PDF: Ctrl + P / Cmd + P
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        triggerBlackout();
        return false;
      }

      // DevTools inspection capture: F12 or Ctrl+Shift+I / C / J
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ["I", "i", "C", "c", "J", "j"].includes(e.key))
      ) {
        e.preventDefault();
        triggerBlackout();
        return false;
      }
    };

    const handleKeyUp = async (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44
      ) {
        await scrubClipboard();
        triggerBlackout();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [triggerBlackout]);

  return (
    <div
      className={`relative select-none ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      onCopy={(e) => {
        e.preventDefault();
        scrubClipboard();
        return false;
      }}
      onCut={(e) => {
        e.preventDefault();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {/* 1. PRINT BLACKOUT SHIELD (Pure black on Ctrl+P / Save as PDF) */}
      <div
        id="drm-blackout-print"
        className="hidden print:block fixed inset-0 bg-black text-black z-[9999999]"
        style={{ backgroundColor: "#000000", color: "#000000" }}
      />

      {/* 2. NETFLIX-STYLE PURE BLACK SCREEN OVERLAY (Activated on screenshot / second device answering) */}
      {isBlackout && (
        <div
          id="drm-black-screen-shield"
          className="fixed inset-0 z-[999999] bg-black text-black flex items-center justify-center select-none"
          style={{ backgroundColor: "#000000", color: "#000000" }}
        />
      )}

      {/* 3. PROTECTED ASSESSMENT CONTENT (Seamless and clean for the user) */}
      <div className="drm-protected-content">{children}</div>
    </div>
  );
}
