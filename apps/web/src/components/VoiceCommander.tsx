"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  activateTwin,
  createPost,
  deactivateTwin,
  getRobotDashboard,
  getTwinBriefing,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useSettingsStore } from "@/lib/settings-store";
import { parseVoiceCommand } from "@/lib/voice-commander";
import { useTranslation } from "@/i18n";

export function VoiceCommander() {
  const { t, dateLocale } = useTranslation();
  const router = useRouter();
  const enabled = useSettingsStore((s) => s.voiceControlEnabled);
  const session = useAuthStore((s) => s.session);
  const [listening, setListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleTranscript = useCallback(
    async (transcript: string) => {
      if (!session) return;
      setLastCommand(transcript);
      const action = parseVoiceCommand(transcript);

      switch (action.type) {
        case "navigate":
          router.push(action.path);
          break;
        case "activate_twin": {
          const dash = await getRobotDashboard(session.accessToken);
          const twin = dash.twins[0];
          if (twin) {
            await activateTwin(session.accessToken, twin.agent_id, session.displayName);
            setBriefingText(t("common.twinActivated", { name: twin.name }));
          }
          break;
        }
        case "deactivate_twin": {
          const dash = await getRobotDashboard(session.accessToken);
          const active = dash.active_twin || dash.twins.find((twin) => twin.is_active);
          if (active) {
            await deactivateTwin(session.accessToken, active.agent_id);
            setBriefingText(t("common.twinDeactivated"));
          }
          break;
        }
        case "briefing": {
          const dash = await getRobotDashboard(session.accessToken);
          const twin = dash.active_twin || dash.twins[0];
          if (twin) {
            const b = await getTwinBriefing(session.accessToken, twin.agent_id);
            setBriefingText(b.voice_summary);
            if ("speechSynthesis" in window) {
              const u = new SpeechSynthesisUtterance(b.voice_summary);
              u.rate = 0.95;
              speechSynthesis.speak(u);
            }
          }
          break;
        }
        case "post":
          await createPost(session.accessToken, {
            body: action.body,
            context: session.viewContext ?? "personal",
          });
          setBriefingText(t("common.voicePosted"));
          break;
        default:
          break;
      }
    },
    [router, session, t]
  );

  useEffect(() => {
    if (!enabled || !session) return;

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = dateLocale;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript?.trim();
      if (transcript) handleTranscript(transcript);
    };

    recognition.onend = () => {
      if (enabled) {
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }

    return () => {
      recognition.stop();
      setListening(false);
    };
  }, [enabled, session, handleTranscript, dateLocale]);

  if (!enabled || !session) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] max-w-xs">
      <div className="rounded-xl border border-[#00E5FF]/30 bg-[#0A0A0A]/95 px-4 py-3 shadow-[0_0_32px_rgba(0,229,255,0.15)] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${listening ? "animate-pulse bg-[#00E5FF]" : "bg-[#5A5A5A]"}`}
          />
          <p className="text-[10px] uppercase tracking-widest text-[#00E5FF]">{t("common.voiceControl")}</p>
        </div>
        {lastCommand && (
          <p className="mt-1.5 text-xs text-[#8A8A8A] truncate">&ldquo;{lastCommand}&rdquo;</p>
        )}
        {briefingText && <p className="mt-1 text-xs text-[#F5F5F5] leading-relaxed">{briefingText}</p>}
      </div>
    </div>
  );
}