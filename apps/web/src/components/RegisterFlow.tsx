"use client";

import type { UserMode } from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import { useState } from "react";
import { generateStubProof, register } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

type Step = "credentials" | "zkp" | "mode";

const MODES: { mode: UserMode; label: string; description: string; color: string }[] = [
  {
    mode: "kids",
    label: "Kids",
    description: "Age-adaptive, safety-first experience with restricted content",
    color: "#7C4DFF",
  },
  {
    mode: "prime",
    label: "Prime",
    description: "Full social experience with verified age credentials",
    color: "#00E5FF",
  },
  {
    mode: "professional",
    label: "Professional",
    description: "LinkedIn-class networking within unified context",
    color: "#4FC3F7",
  },
];

export function RegisterFlow({ onComplete }: { onComplete: () => void }) {
  const setSession = useAuthStore((s) => s.setSession);
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [zkpStatus, setZkpStatus] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<UserMode>("prime");

  async function handleZKPVerify() {
    setLoading(true);
    setError(null);
    try {
      const proof = await generateStubProof(true);
      const result = await register({
        email,
        password,
        display_name: displayName,
        age_proof: proof,
      });
      setZkpStatus(result.zkp_result.message);
      setAccessToken(result.access_token);
      setSelectedMode(result.mode);
      setSession({
        accessToken: result.access_token,
        userId: result.user_id,
        email: result.email,
        displayName: result.display_name,
        mode: result.mode,
        ageVerified: result.age_verified,
        viewContext: "personal",
      });
      setStep("mode");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleModeConfirm() {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const { selectMode } = await import("@/lib/api");
      const result = await selectMode(accessToken, selectedMode);
      useAuthStore.getState().updateMode(result.mode, result.access_token);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mode selection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">
          Join NEXSOCIO
        </h1>
        <p className="mt-2 text-sm text-[#8A8A8A]">
          Zero-trust identity with ZKP age verification
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {(["credentials", "zkp", "mode"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-1.5 w-8 rounded-full transition-colors ${
                step === s || (["zkp", "mode"].includes(step) && s === "credentials") || (step === "mode" && s === "zkp")
                  ? "bg-[#00E5FF]"
                  : step === "mode" && s === "mode"
                    ? "bg-[#00E5FF]"
                    : ["credentials"].includes(step) && s !== "credentials"
                      ? "bg-[#2A2A2A]"
                      : step === "zkp" && s === "mode"
                        ? "bg-[#2A2A2A]"
                        : step === s
                          ? "bg-[#00E5FF]"
                          : "bg-[#2A2A2A]"
              }`}
            />
            {i < 2 && <div className="w-2" />}
          </div>
        ))}
      </div>

      {error && (
        <Panel open title="Error" className="border-[#FF5252]/30">
          <p className="text-sm text-[#FF5252]">{error}</p>
        </Panel>
      )}

      {step === "credentials" && (
        <Panel open title="Create Account" subtitle="Step 1 of 3">
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Voss"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@nexsocio.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
            <Button
              className="w-full"
              disabled={!email || !password || displayName.length < 2}
              onClick={() => setStep("zkp")}
            >
              Continue to Verification
            </Button>
          </div>
        </Panel>
      )}

      {step === "zkp" && (
        <Panel open title="Age Verification" subtitle="Step 2 of 3 — Zero-Knowledge Proof">
          <div className="space-y-4">
            <div className="rounded-md border border-[#2A2A2A] bg-[#0A0A0A] p-4">
              <p className="text-xs text-[#8A8A8A] leading-relaxed">
                NEXSOCIO uses zero-knowledge proofs to verify age without storing personal
                documents. Your biometric and identity data never leaves your device.
              </p>
            </div>
            {zkpStatus && (
              <div className="rounded-md border border-[#00C853]/30 bg-[#00C853]/5 p-3">
                <p className="text-xs text-[#00C853]">{zkpStatus}</p>
              </div>
            )}
            <Button className="w-full" loading={loading} onClick={handleZKPVerify}>
              Verify Age (ZKP Stub)
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("credentials")}>
              Back
            </Button>
          </div>
        </Panel>
      )}

      {step === "mode" && (
        <Panel open title="Select Mode" subtitle="Step 3 of 3 — Age-adaptive context">
          <div className="space-y-3">
            {MODES.map((m) => (
              <button
                key={m.mode}
                onClick={() => setSelectedMode(m.mode)}
                className={`w-full rounded-md border p-4 text-left transition-all ${
                  selectedMode === m.mode
                    ? "border-[#00E5FF]/50 bg-[#00E5FF]/5"
                    : "border-[#2A2A2A] bg-[#0A0A0A] hover:border-[#3A3A3A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="text-sm font-medium text-[#F5F5F5]">{m.label}</span>
                </div>
                <p className="mt-1.5 text-xs text-[#8A8A8A]">{m.description}</p>
              </button>
            ))}
            <Button className="w-full mt-2" loading={loading} onClick={handleModeConfirm}>
              Enter NEXSOCIO
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}