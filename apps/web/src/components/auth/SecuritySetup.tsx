"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useState } from "react";
import {
  enrollBiometric,
  enrollPin,
  enrollWebAuthn,
  getWebAuthnRegisterOptions,
} from "@/lib/api";
import { registerWebAuthn } from "@/lib/auth-methods";
import { useAuthStore } from "@/lib/auth-store";
import { CameraCapture } from "./CameraCapture";
import { PinPad } from "./PinPad";
import { VoiceAuth } from "./VoiceAuth";

export function SecuritySetup() {
  const session = useAuthStore((s) => s.session);
  const [pin, setPin] = useState("");
  const [childName, setChildName] = useState("");
  const [approvalCode, setApprovalCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  async function withAuth<T>(fn: () => Promise<T>) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage("Security method enrolled successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel open title="Security Methods" subtitle="Step up authentication after sign-in">
        <p className="text-xs text-[#8A8A8A] mb-4">
          Enroll additional unlock methods. Biometric hashes stay on-device; only secure templates
          are stored.
        </p>

        {message && <p className="text-xs text-[#00C853] mb-3">{message}</p>}
        {error && <p className="text-xs text-[#FF5252] mb-3">{error}</p>}

        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-[#F5F5F5] mb-2">6-Digit PIN</p>
            <PinPad value={pin} onChange={setPin} disabled={loading} />
            <Button
              className="w-full mt-3"
              size="sm"
              loading={loading}
              disabled={pin.length !== 6}
              onClick={() =>
                withAuth(() => enrollPin(session.accessToken, pin).then(() => setPin("")))
              }
            >
              Save PIN
            </Button>
          </div>

          <div>
            <p className="text-xs font-medium text-[#F5F5F5] mb-2">Passkey / Face ID / Touch ID</p>
            <Button
              size="sm"
              loading={loading}
              onClick={() =>
                withAuth(async () => {
                  const options = await getWebAuthnRegisterOptions(session.accessToken);
                  const { credentialId, challenge } = await registerWebAuthn(options);
                  await enrollWebAuthn(session.accessToken, credentialId, challenge);
                })
              }
            >
              Register Passkey
            </Button>
          </div>

          <div>
            <p className="text-xs font-medium text-[#F5F5F5] mb-2">Face Scan</p>
            <CameraCapture
              mode="face"
              loading={loading}
              onCapture={(hash) =>
                withAuth(() => enrollBiometric(session.accessToken, "face", hash, "Face ID"))
              }
              onError={setError}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-[#F5F5F5] mb-2">Palm Scan</p>
            <CameraCapture
              mode="palm"
              loading={loading}
              onCapture={(hash) =>
                withAuth(() => enrollBiometric(session.accessToken, "palm", hash, "Palm"))
              }
              onError={setError}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-[#F5F5F5] mb-2">Voice Print</p>
            <VoiceAuth
              loading={loading}
              onCapture={(hash, cmd) =>
                withAuth(() =>
                  enrollBiometric(session.accessToken, "voice", hash, `Voice: ${cmd}`)
                )
              }
              onError={setError}
            />
          </div>
        </div>
      </Panel>

      {session.mode !== "kids" && session.ageVerified && (
        <Panel open title="Approve Child Registration" subtitle="Generate code for kids Face ID signup">
          <div className="space-y-3">
            <Input
              label="Child's Name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Exact name child will use"
            />
            <Button
              size="sm"
              loading={loading}
              disabled={childName.length < 2}
              onClick={() =>
                withAuth(async () => {
                  const { createParentalApproval } = await import("@/lib/api");
                  const res = await createParentalApproval(session.accessToken, childName);
                  setApprovalCode(res.approval_code);
                })
              }
            >
              Generate Approval Code
            </Button>
            {approvalCode && (
              <div className="rounded-md border border-[#7C4DFF]/40 bg-[#7C4DFF]/10 p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-[#8A8A8A]">Approval Code</p>
                <p className="mt-1 text-2xl font-mono font-bold text-[#7C4DFF]">{approvalCode}</p>
                <p className="mt-2 text-[10px] text-[#5A5A5A]">Valid 24 hours · Face ID only</p>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}