"use client";

import type { AuthMethod } from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import { useState } from "react";
import {
  enrollBiometricWithPassword,
  enrollPinWithPassword,
  enrollWebAuthnWithPassword,
  getWebAuthnRegisterOptionsWithPassword,
} from "@/lib/api";
import { registerWebAuthn, voiceTemplateHash } from "@/lib/auth-methods";
import { CameraCapture } from "./CameraCapture";
import { PinPad } from "./PinPad";
import { VoiceAuth } from "./VoiceAuth";

interface MethodSetupProps {
  email: string;
  method: AuthMethod;
  onEnrolled: () => void;
}

export function MethodSetup({ email, method, onEnrolled }: MethodSetupProps) {
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function enroll(action: () => Promise<void>) {
    if (!email || password.length < 8) {
      setError("Enter your email and password to enroll this method.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await action();
      setSuccess(true);
      onEnrolled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p className="text-sm text-[#00C853]">
        ✓ Method enrolled — you can now sign in with {method}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#8A8A8A]">
        Verify your password once to set up this sign-in method.
      </p>
      <Input
        label="Password (for enrollment)"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Your account password"
      />
      {error && <p className="text-xs text-[#FF5252]">{error}</p>}

      {method === "pin" && (
        <Panel open title="Set 6-Digit PIN">
          <div className="space-y-4">
            <PinPad value={pin} onChange={setPin} disabled={loading} />
            <Button
              className="w-full"
              loading={loading}
              disabled={pin.length !== 6}
              onClick={() =>
                enroll(() => enrollPinWithPassword(email, password, pin))
              }
            >
              Save PIN
            </Button>
          </div>
        </Panel>
      )}

      {method === "webauthn" && (
        <Button
          className="w-full"
          loading={loading}
          onClick={() =>
            enroll(async () => {
              const options = await getWebAuthnRegisterOptionsWithPassword(email, password);
              const { credentialId, challenge } = await registerWebAuthn(options);
              await enrollWebAuthnWithPassword(email, password, credentialId, challenge);
            })
          }
        >
          Register Passkey / Face ID / Touch ID
        </Button>
      )}

      {method === "face" && (
        <CameraCapture
          mode="face"
          loading={loading}
          onCapture={(hash) =>
            enroll(() => enrollBiometricWithPassword(email, password, "face", hash))
          }
          onError={setError}
        />
      )}

      {method === "palm" && (
        <CameraCapture
          mode="palm"
          loading={loading}
          onCapture={(hash) =>
            enroll(() => enrollBiometricWithPassword(email, password, "palm", hash))
          }
          onError={setError}
        />
      )}

      {method === "voice" && (
        <VoiceAuth
          loading={loading}
          onCapture={(_hash, cmd) => {
            const normalized = cmd.toLowerCase().replace(/[.,!?]/g, "").trim();
            if (!normalized.includes("nexsocio") || !normalized.includes("unlock")) {
              setError('Say "Nexsocio unlock" clearly');
              return;
            }
            enroll(async () => {
              const hash = await voiceTemplateHash();
              await enrollBiometricWithPassword(email, password, "voice", hash);
            });
          }}
          onError={setError}
        />
      )}
    </div>
  );
}