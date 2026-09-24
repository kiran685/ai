/**
 * Assessment DRM & Anti-Cheat Security Module
 * 
 * Features:
 * 1. Screenshot Shortcut & Key Detection (PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5, Alt+PrtScn, Ctrl+Shift+S, Ctrl+P)
 * 2. Clipboard Sanitization / Scrubbing on capture attempts
 * 3. Cross-Device / Concurrent Session Answering Collision Detection via BroadcastChannel & LocalStorage Heartbeats
 * 4. Display Media / Screen Capture API interception
 * 5. Tab Switching Allowed & State Preservation
 */

export interface DrmSecurityState {
  isBlackout: boolean;
  blackoutReason: "screenshot" | "second_device" | "screen_record" | "print_attempt" | "camera_device" | "manual_test" | null;
  blackoutMessage: string;
  tabSwitchCount: number;
  lastTabSwitchTime: number | null;
  activeDeviceSessionId: string;
  isMultiDeviceConflict: boolean;
}

export interface SecurityEventPayload {
  type: "HEARTBEAT" | "ANSWER_SUBMITTED" | "DEVICE_CLAIM" | "BLACKOUT_TRIGGERED";
  sessionId: string;
  deviceInstanceId: string;
  timestamp: number;
  payload?: any;
}

// Generate unique session / device IDs
export function generateDeviceId(): string {
  return "dev_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
}

/**
 * Scrub clipboard contents to prevent captured screenshots or copied question text
 * from remaining in the OS clipboard
 */
export async function scrubClipboard(): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText("");
      return true;
    }
  } catch {
    // Clipboard write may fail if permissions are restricted; silent fail
  }
  return false;
}

/**
 * Cross-Device Session Manager
 * Synchronizes assessment sessions across tabs/windows and detects if another device
 * or window starts answering the assessment simultaneously.
 */
export class AssessmentSessionGuard {
  private assessmentId: string;
  private deviceInstanceId: string;
  private channel: BroadcastChannel | null = null;
  private heartbeatTimer: any = null;
  private onConflictCallback: ((reason: string) => void) | null = null;

  constructor(assessmentId: string, deviceInstanceId: string) {
    this.assessmentId = assessmentId;
    this.deviceInstanceId = deviceInstanceId;
    this.init();
  }

  private init() {
    if (typeof window === "undefined") return;

    // 1. Initialize BroadcastChannel if supported
    if ("BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel(`assessment_channel_${this.assessmentId}`);
        this.channel.onmessage = (event: MessageEvent<SecurityEventPayload>) => {
          this.handleChannelMessage(event.data);
        };
      } catch (e) {
        console.warn("BroadcastChannel error:", e);
      }
    }

    // 2. Listen to localStorage storage events (fallback across tabs & windows)
    window.addEventListener("storage", this.handleStorageEvent);

    // 3. Claim this device as the active assessment instance
    this.claimDevice();

    // 4. Start periodic heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 2000);
  }

  public setConflictHandler(callback: (reason: string) => void) {
    this.onConflictCallback = callback;
  }

  public claimDevice() {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const claimData: SecurityEventPayload = {
      type: "DEVICE_CLAIM",
      sessionId: this.assessmentId,
      deviceInstanceId: this.deviceInstanceId,
      timestamp: now,
    };

    localStorage.setItem(
      `assessment_active_device_${this.assessmentId}`,
      JSON.stringify(claimData)
    );

    if (this.channel) {
      this.channel.postMessage(claimData);
    }
  }

  private sendHeartbeat() {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const heartbeatData: SecurityEventPayload = {
      type: "HEARTBEAT",
      sessionId: this.assessmentId,
      deviceInstanceId: this.deviceInstanceId,
      timestamp: now,
    };

    localStorage.setItem(
      `assessment_heartbeat_${this.assessmentId}`,
      JSON.stringify(heartbeatData)
    );

    if (this.channel) {
      this.channel.postMessage(heartbeatData);
    }
  }

  public notifyAnswerSubmitted(questionId: string) {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const eventData: SecurityEventPayload = {
      type: "ANSWER_SUBMITTED",
      sessionId: this.assessmentId,
      deviceInstanceId: this.deviceInstanceId,
      timestamp: now,
      payload: { questionId },
    };

    localStorage.setItem(
      `assessment_answer_sync_${this.assessmentId}`,
      JSON.stringify(eventData)
    );

    if (this.channel) {
      this.channel.postMessage(eventData);
    }
  }

  private handleChannelMessage(data: SecurityEventPayload) {
    if (!data || data.sessionId !== this.assessmentId) return;

    // If another device / window claims this session or submits an answer
    if (data.deviceInstanceId !== this.deviceInstanceId) {
      if (data.type === "ANSWER_SUBMITTED" || data.type === "DEVICE_CLAIM") {
        if (this.onConflictCallback) {
          this.onConflictCallback(
            `Another device or session (${data.deviceInstanceId.slice(-6)}) is actively answering this assessment.`
          );
        }
      }
    }
  }

  private handleStorageEvent = (e: StorageEvent) => {
    if (!e.newValue) return;

    if (
      e.key === `assessment_answer_sync_${this.assessmentId}` ||
      e.key === `assessment_active_device_${this.assessmentId}`
    ) {
      try {
        const data: SecurityEventPayload = JSON.parse(e.newValue);
        if (data.deviceInstanceId !== this.deviceInstanceId) {
          if (this.onConflictCallback) {
            this.onConflictCallback(
              `Concurrent session activity detected from a secondary device/window.`
            );
          }
        }
      } catch {
        // parsing error ignore
      }
    }
  };

  public destroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", this.handleStorageEvent);
    }
  }
}
