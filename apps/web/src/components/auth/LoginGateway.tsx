"use client";

import type { AuthMethod } from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getAuthMethods,
  getWebAuthnLoginOptions,
  loginBiometric,
  loginKidsFace,
  loginPassword,
  loginPin,
  loginWebAuthn,
} from "@/lib/api";
import {
  isPlatformAuthenticatorAvailable,
  loginWebAuthn as browserWebAuthnLogin,
} from "@/lib/auth-methods";
import { applyAuthLogin } from "@/lib/session";
import { CameraCapture } from "./CameraCapture";
import { PinPad } from "./PinPad";
import { VoiceAuth } from "./VoiceAuth";

const METHODS: { id: AuthMethod | "kids"; label: string; icon: string }[] = [
  { id: "webauthn", label: "Biometric", icon: "◎" },
  { id: "pin", label: "PIN", icon: "⁕" },
  { id: "face", label: "Face ID", icon: "◉" },
  { id: "palm", label: "Palm", icon: "✋" },
  { id: "voice", label: "Voice", icon: "🎙" },
  { id: "password", label: "Password", icon: "🔑" },
  { id: "kids", label: "Kids", icon: "👶" },
];

export function LoginGateway() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [kidsName, setKidsName] = useState("");
  const [method, setMethod] = useState<AuthMethod | "kids">("webauthn");
  const [available, setAvailable] = useState<AuthMethod[]>(["password"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setBiometricAvailable);
  }, []);

  const refreshMethods = useCallback(async () => {
    if (!email.includes("@")) return;
    try {
      const res = await getAuthMethods(email);
      setAvailable(res.methods);
    } catch {
      setAvailable(["password"]);
    }
  }, [email]);

  useEffect(() => {
    const t = setTimeout(refreshMethods, 400);
    return () => clearTimeout(t);
  }, [email, refreshMethods]);

  async function handlePasswordLogin() {
    setLoading(true);
    setError(null);
    try {
      const result = await loginPassword(email, password);
      applyAuthLogin(result);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePinLogin() {
    if (pin.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loginPin(email, pin);
      applyAuthLogin(result);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  async function handleWebAuthnLogin() {
    setLoading(true);
    setError(null);
    try {
      const options = await getWebAuthnLoginOptions(email);
      const { credentialId, challenge } = await browserWebAuthnLogin(options);
      const result = await loginWebAuthn(credentialId, challenge, email);
      applyAuthLogin(result);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Biometric login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricLogin(
    factorType: "face" | "palm" | "voice",
    templateHash: string,
    voiceCommand?: string
  ) {
    setLoading(true);
    setError(null);
    try {
      const result = await loginBiometric(email, factorType, templateHash, voiceCommand);
      applyAuthLogin(result);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleKidsFaceLogin(templateHash: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await loginKidsFace(kidsName, templateHash);
      applyAuthLogin(result);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Face ID verification failed");
    } finally {
      setLoading(false);
    }
  }

  const methodEnabled = (id: AuthMethod | "kids") => {
    if (id === "kids") return true;
    if (id === "webauthn") return biometricAvailable && available.includes("webauthn");
    if (id === "password") return true;
    return available.includes(id);
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Sign in to Nexus</h1>
        <p className="mt-2 text-sm text-[#8A8A8A]">
          Multi-factor authentication · Camera &amp; mic enabled for biometrics
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={!methodEnabled(m.id)}
            onClick={() => {
              setMethod(m.id);
              setError(null);
            }}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider rounded-md border transition-colors ${
              method === m.id
                ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                : methodEnabled(m.id)
                  ? "border-[#2A2A2A] text-[#8A8A8A] hover:border-[#3A3A3A]"
                  : "border-[#1F1F1F] text-[#4A4A4A] opacity-50 cursor-not-allowed"
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {error && (
        <Panel open title="Authentication Error" className="border-[#FF5252]/30">
          <p className="text-sm text-[#FF5252]">{error}</p>
        </Panel>
      )}

      {method !== "kids" && (
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@nexus.io"
        />
      )}

      {method === "password" && (
        <Panel open title="Password Sign In">
          <div className="space-y-4">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
            <Button
              className="w-full"
              loading={loading}
              disabled={!email || password.length < 8}
              onClick={handlePasswordLogin}
            >
              Sign In
            </Button>
          </div>
        </Panel>
      )}

      {method === "pin" && (
        <Panel open title="6-Digit PIN" subtitle={available.includes("pin") ? "Enter your PIN" : "Enroll PIN after password login"}>
          <div className="space-y-4">
            <PinPad value={pin} onChange={setPin} disabled={loading} />
            <Button
              className="w-full"
              loading={loading}
              disabled={!email || pin.length !== 6 || !available.includes("pin")}
              onClick={handlePinLogin}
            >
              Unlock with PIN
            </Button>
          </div>
        </Panel>
      )}

      {method === "webauthn" && (
        <Panel open title="Biometric / Passkey" subtitle="Face ID · Touch ID · Fingerprint">
          <div className="space-y-4">
            <p className="text-xs text-[#8A8A8A] leading-relaxed">
              Uses your device&apos;s secure enclave. No biometric data is sent to Nexus servers.
            </p>
            <Button
              className="w-full"
              loading={loading}
              disabled={!email || !available.includes("webauthn")}
              onClick={handleWebAuthnLogin}
            >
              {biometricAvailable ? "Authenticate with Biometrics" : "Biometrics Unavailable"}
            </Button>
          </div>
        </Panel>
      )}

      {method === "face" && (
        <Panel open title="Face ID Scan" subtitle="Camera required">
          {available.includes("face") ? (
            <CameraCapture
              mode="face"
              loading={loading}
              onCapture={(hash) => handleBiometricLogin("face", hash)}
              onError={setError}
            />
          ) : (
            <p className="text-sm text-[#8A8A8A]">
              Face ID not enrolled. Sign in with password first, then enroll in Profile → Security.
            </p>
          )}
        </Panel>
      )}

      {method === "palm" && (
        <Panel open title="Palm Scan" subtitle="Camera + touch mapping">
          {available.includes("palm") ? (
            <CameraCapture
              mode="palm"
              loading={loading}
              onCapture={(hash) => handleBiometricLogin("palm", hash)}
              onError={setError}
            />
          ) : (
            <p className="text-sm text-[#8A8A8A]">
              Palm scan not enrolled. Sign in with password first to set up palm authentication.
            </p>
          )}
        </Panel>
      )}

      {method === "voice" && (
        <Panel open title="Voice Command" subtitle='Say "Nexus unlock"'>
          {available.includes("voice") ? (
            <VoiceAuth
              loading={loading}
              onCapture={(hash, cmd) => handleBiometricLogin("voice", hash, cmd)}
              onError={setError}
            />
          ) : (
            <p className="text-sm text-[#8A8A8A]">
              Voice print not enrolled. Sign in with password first to enroll your voice.
            </p>
          )}
        </Panel>
      )}

      {method === "kids" && (
        <Panel open title="Kids Face ID Login" subtitle="Face ID only · Real human verification">
          <div className="space-y-4">
            <Input
              label="Your Name"
              value={kidsName}
              onChange={(e) => setKidsName(e.target.value)}
              placeholder="Name from registration"
            />
            <p className="text-xs text-[#7C4DFF]">
              Children can only sign in with Face ID. Parental approval was required at registration.
            </p>
            {kidsName.length >= 2 && (
              <CameraCapture
                mode="face"
                loading={loading}
                onCapture={handleKidsFaceLogin}
                onError={setError}
              />
            )}
          </div>
        </Panel>
      )}

      <p className="text-center text-xs text-[#5A5A5A]">
        New to Nexus?{" "}
        <Link href="/register" className="text-[#00E5FF] hover:underline">
          Create account
        </Link>
        {" · "}
        <Link href="/register?kids=1" className="text-[#7C4DFF] hover:underline">
          Kids registration
        </Link>
      </p>
    </div>
  );
}