"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateStubProof, registerKids } from "@/lib/api";
import { applyAuthLogin } from "@/lib/session";
import { CameraCapture } from "./CameraCapture";

export function KidsRegisterFlow() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [faceHash, setFaceHash] = useState<string | null>(null);
  const [step, setStep] = useState<"info" | "face" | "done">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!faceHash) return;
    setLoading(true);
    setError(null);
    try {
      let proof;
      try {
        proof = await generateStubProof(false);
      } catch (e) {
        console.warn("Server stub proof generation failed, generating local child stub proof:", e);
        const randomHex = Array.from({ length: 16 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");
        proof = {
          proof: `zkp_invalid_${randomHex}`,
          public_inputs: {
            min_age: "13",
            issued: new Date().toISOString(),
          },
          minimum_age: 13,
        };
      }

      const result = await registerKids({
        display_name: displayName,
        face_template_hash: faceHash,
        parental_approval_code: approvalCode,
        age_proof: proof,
      });
      applyAuthLogin(result);
      setStep("done");
      router.push("/feed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[#F5F5F5]">Kids Registration</h1>
        <p className="mt-2 text-sm text-[#8A8A8A]">
          Face ID only · Parental approval required · Real human verification
        </p>
      </div>

      <div className="rounded-lg border border-[#7C4DFF]/30 bg-[#7C4DFF]/5 px-4 py-3">
        <p className="text-xs text-[#7C4DFF] leading-relaxed">
          A verified parent or guardian must generate an approval code from their NexSocio account
          (Profile → Approve Child). Children under age cannot register without this step.
        </p>
      </div>

      {error && (
        <Panel open title="Error" className="border-[#FF5252]/30">
          <p className="text-sm text-[#FF5252]">{error}</p>
        </Panel>
      )}

      {step === "info" && (
        <Panel open title="Child Details" subtitle="Step 1 of 2">
          <div className="space-y-4">
            <Input
              label="Child's Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Must match parental approval"
            />
            <Input
              label="Parental Approval Code"
              value={approvalCode}
              onChange={(e) => setApprovalCode(e.target.value)}
              placeholder="6-digit code from parent"
            />
            <Button
              className="w-full"
              disabled={displayName.length < 2 || approvalCode.length < 6}
              onClick={() => setStep("face")}
            >
              Continue to Face ID
            </Button>
          </div>
        </Panel>
      )}

      {step === "face" && (
        <Panel open title="Face ID Verification" subtitle="Step 2 of 2 — Camera required">
          <div className="space-y-4">
            <p className="text-xs text-[#8A8A8A]">
              Scan the child&apos;s face to confirm a real human is registering. This template is
              stored as a secure hash — never raw biometric data.
            </p>
            <CameraCapture
              mode="face"
              loading={loading}
              onCapture={(hash) => {
                setFaceHash(hash);
                setError(null);
              }}
              onError={setError}
            />
            {faceHash && (
              <div className="space-y-2">
                <p className="text-xs text-[#00C853]">✓ Face captured successfully</p>
                <Button className="w-full" loading={loading} onClick={handleRegister}>
                  Complete Kids Registration
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep("info")}>
                  Back
                </Button>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}