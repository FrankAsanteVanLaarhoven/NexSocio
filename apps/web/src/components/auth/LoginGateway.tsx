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
  isWebAuthnAvailable,
  loginWebAuthn as browserWebAuthnLogin,
  VOICE_COMMAND,
} from "@/lib/auth-methods";
import { applyAuthLogin } from "@/lib/session";
import { CameraCapture } from "./CameraCapture";
import { MethodSetup } from "./MethodSetup";
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
  const [method, setMethod] = useState<AuthMethod | "kids">("password");
  const [available, setAvailable] = useState<AuthMethod[]>(["password"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [platformAuth, setPlatformAuth] = useState(false);

  useEffect(() => {
    setWebauthnSupported(isWebAuthnAvailable());
    isPlatformAuthenticatorAvailable().then(setPlatformAuth);
  }, []);

  const refreshMethods = useCallback(async () => {
    if (!email.includes("@")) {
      setAvailable(["password"]);
      return;
    }
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

  const isEnrolled = (id: AuthMethod) => available.includes(id);

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

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Sign in to NEXSOCIO</h1>
        <p className="mt-2 text-sm text-[#8A8A8A]">
          Tap a method to sign in or set it up for testing
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {METHODS.map((m) => {
          const enrolled =
            m.id === "kids" || m.id === "password" || isEnrolled(m.id as AuthMethod);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMethod(m.id);
                setError(null);
              }}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider rounded-md border transition-colors ${
                method === m.id
                  ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                  : "border-[#2A2A2A] text-[#8A8A8A] hover:border-[#3A3A3A] hover:text-[#F5F5F5]"
              }`}
            >
              {m.icon} {m.label}
              {!enrolled && m.id !== "kids" && m.id !== "password" && (
                <span className="ml-1 text-[#FFB300]">+</span>
              )}
            </button>
          );
        })}
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
          placeholder="you@nexsocio.io"
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
            <p className="text-[10px] text-[#5A5A5A] text-center">
              Sign in first, then enroll other methods using the tabs above (+)
            </p>
          </div>
        </Panel>
      )}

      {method === "pin" && email.includes("@") && (
        <Panel
          open
          title="6-Digit PIN"
          subtitle={isEnrolled("pin") ? "Enter your PIN to unlock" : "Set up your PIN"}
        >
          {isEnrolled("pin") ? (
            <div className="space-y-4">
              <PinPad value={pin} onChange={setPin} disabled={loading} />
              <Button
                className="w-full"
                loading={loading}
                disabled={pin.length !== 6}
                onClick={handlePinLogin}
              >
                Unlock with PIN
              </Button>
            </div>
          ) : (
            <MethodSetup email={email} method="pin" onEnrolled={refreshMethods} />
          )}
        </Panel>
      )}

      {method === "webauthn" && email.includes("@") && (
        <Panel
          open
          title="Biometric / Passkey"
          subtitle="Face ID · Touch ID · Fingerprint"
        >
          {!webauthnSupported ? (
            <p className="text-sm text-[#8A8A8A]">
              WebAuthn is not supported in this browser. Use Face ID scan or Password instead.
            </p>
          ) : isEnrolled("webauthn") ? (
            <div className="space-y-4">
              <p className="text-xs text-[#8A8A8A]">
                {platformAuth
                  ? "Use your device biometrics or security key."
                  : "Use your registered passkey or security key."}
              </p>
              <Button className="w-full" loading={loading} onClick={handleWebAuthnLogin}>
                Authenticate with Biometrics
              </Button>
            </div>
          ) : (
            <MethodSetup email={email} method="webauthn" onEnrolled={refreshMethods} />
          )}
        </Panel>
      )}

      {method === "face" && email.includes("@") && (
        <Panel open title="Face ID Scan" subtitle="Camera required">
          {isEnrolled("face") ? (
            <CameraCapture
              mode="face"
              loading={loading}
              onCapture={(hash) => handleBiometricLogin("face", hash)}
              onError={setError}
            />
          ) : (
            <MethodSetup email={email} method="face" onEnrolled={refreshMethods} />
          )}
        </Panel>
      )}

      {method === "palm" && email.includes("@") && (
        <Panel open title="Palm Scan" subtitle="Camera + touch mapping">
          {isEnrolled("palm") ? (
            <CameraCapture
              mode="palm"
              loading={loading}
              onCapture={(hash) => handleBiometricLogin("palm", hash)}
              onError={setError}
            />
          ) : (
            <MethodSetup email={email} method="palm" onEnrolled={refreshMethods} />
          )}
        </Panel>
      )}

      {method === "voice" && email.includes("@") && (
        <Panel open title="Voice Command" subtitle={`Say "${VOICE_COMMAND}"`}>
          {isEnrolled("voice") ? (
            <VoiceAuth
              loading={loading}
              onCapture={(hash, cmd) => handleBiometricLogin("voice", hash, cmd)}
              onError={setError}
            />
          ) : (
            <MethodSetup email={email} method="voice" onEnrolled={refreshMethods} />
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
              Children can only sign in with Face ID. Register at{" "}
              <Link href="/register?kids=1" className="underline">
                Kids registration
              </Link>{" "}
              first (parental approval required).
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

      {method !== "kids" && method !== "password" && !email.includes("@") && (
        <p className="text-center text-xs text-[#8A8A8A]">Enter your email to continue</p>
      )}

      <p className="text-center text-xs text-[#5A5A5A]">
        New to NEXSOCIO?{" "}
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