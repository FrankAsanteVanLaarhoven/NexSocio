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
import { useTranslation } from "@/i18n";

const METHODS: { id: AuthMethod | "kids"; labelKey: string; icon: string }[] = [
  { id: "webauthn", labelKey: "auth.biometric", icon: "◎" },
  { id: "pin", labelKey: "auth.methodPin", icon: "⁕" },
  { id: "face", labelKey: "auth.methodFace", icon: "◉" },
  { id: "palm", labelKey: "auth.methodPalm", icon: "✋" },
  { id: "voice", labelKey: "auth.methodVoice", icon: "🎙" },
  { id: "password", labelKey: "auth.methodPassword", icon: "🔑" },
  { id: "kids", labelKey: "auth.methodKids", icon: "👶" },
];

export function LoginGateway() {
  const { t } = useTranslation();
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
      setError(e instanceof Error ? e.message : t("auth.loginFailed"));
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
      setError(e instanceof Error ? e.message : t("auth.invalidPin"));
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
      setError(e instanceof Error ? e.message : t("auth.biometricFailed"));
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
      setError(e instanceof Error ? e.message : t("auth.verificationFailed"));
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
      setError(e instanceof Error ? e.message : t("auth.faceIdFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">{t("auth.signInTitle")}</h1>
        <p className="mt-2 text-sm text-[#8A8A8A]">
          {t("auth.signInSubtitle")}
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
              {m.icon} {t(m.labelKey)}
              {!enrolled && m.id !== "kids" && m.id !== "password" && (
                <span className="ml-1 text-[#FFB300]">+</span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <Panel open title={t("auth.authError")} className="border-[#FF5252]/30">
          <p className="text-sm text-[#FF5252]">{error}</p>
        </Panel>
      )}

      {method !== "kids" && (
        <Input
          label={t("auth.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.emailPlaceholder")}
        />
      )}

      {method === "password" && (
        <Panel open title={t("auth.passwordSignIn")}>
          <div className="space-y-4">
            <Input
              label={t("auth.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
            />
            <Button
              className="w-full"
              loading={loading}
              disabled={!email || password.length < 8}
              onClick={handlePasswordLogin}
            >
              {t("auth.signIn")}
            </Button>
            <p className="text-[10px] text-[#5A5A5A] text-center">
              {t("auth.enrollHint")}
            </p>
          </div>
        </Panel>
      )}

      {method === "pin" && email.includes("@") && (
        <Panel
          open
          title={t("auth.pinTitle")}
          subtitle={isEnrolled("pin") ? t("auth.pinUnlock") : t("auth.pinSetup")}
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
                {t("auth.unlockPin")}
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
          title={t("auth.biometricPasskey")}
          subtitle={t("auth.biometricSubtitle")}
        >
          {!webauthnSupported ? (
            <p className="text-sm text-[#8A8A8A]">
              {t("auth.webauthnUnsupported")}
            </p>
          ) : isEnrolled("webauthn") ? (
            <div className="space-y-4">
              <p className="text-xs text-[#8A8A8A]">
                {platformAuth
                  ? t("auth.useDeviceBiometrics")
                  : t("auth.useRegisteredPasskey")}
              </p>
              <Button className="w-full" loading={loading} onClick={handleWebAuthnLogin}>
                {t("auth.authenticateBiometric")}
              </Button>
            </div>
          ) : (
            <MethodSetup email={email} method="webauthn" onEnrolled={refreshMethods} />
          )}
        </Panel>
      )}

      {method === "face" && email.includes("@") && (
        <Panel open title={t("auth.faceIdScan")} subtitle={t("auth.cameraRequired")}>
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
        <Panel open title={t("auth.palmScan")} subtitle={t("auth.cameraTouch")}>
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
        <Panel open title={t("auth.voiceCommand")} subtitle={`Say "${VOICE_COMMAND}"`}>
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
        <Panel open title={t("auth.kidsFaceLogin")} subtitle={t("auth.kidsSubtitle")}>
          <div className="space-y-4">
            <Input
              label={t("auth.yourName")}
              value={kidsName}
              onChange={(e) => setKidsName(e.target.value)}
              placeholder={t("auth.namePlaceholder")}
            />
            <p className="text-xs text-[#7C4DFF]">
              {t("auth.kidsRegisterAt")}{" "}
              <Link href="/register?kids=1" className="underline">
                {t("auth.kidsFaceRegister")}
              </Link>{" "}
              {t("auth.kidsRegisterFirst")}
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
        <p className="text-center text-xs text-[#8A8A8A]">{t("auth.enterEmail")}</p>
      )}

      <p className="text-center text-xs text-[#5A5A5A]">
        {t("auth.newHere")}{" "}
        <Link href="/register" className="text-[#00E5FF] hover:underline">
          {t("auth.createAccount")}
        </Link>
        {" · "}
        <Link href="/register?kids=1" className="text-[#7C4DFF] hover:underline">
          {t("auth.kidsFaceRegister")}
        </Link>
      </p>
    </div>
  );
}