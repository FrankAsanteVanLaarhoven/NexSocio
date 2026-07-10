"use client";

import type { BusinessProfile, BusinessToolsAccess } from "@nexus/types";
import { Button, Input } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import {
  getBusinessProfile,
  getBusinessToolsAccess,
  startBusinessToolsTrial,
  upsertBusinessProfile,
} from "@/lib/api";
import { useTranslation } from "@/i18n";

type Step = 1 | 2 | 3;

export function BusinessOnboardingModal({
  open,
  token,
  onClose,
  onSwitchLane,
  onComplete,
}: {
  open: boolean;
  token: string;
  onClose: () => void;
  onSwitchLane: () => void;
  onComplete?: () => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [toolsAccess, setToolsAccess] = useState<BusinessToolsAccess | null>(null);
  const [bizName, setBizName] = useState("");
  const [bizCategory, setBizCategory] = useState("general");
  const [bizTagline, setBizTagline] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadBusinessState = useCallback(async () => {
    const [profile, tools] = await Promise.all([
      getBusinessProfile(token),
      getBusinessToolsAccess(token),
    ]);
    setBusinessProfile(profile);
    setToolsAccess(tools);
    if (profile) {
      setBizName(profile.business_name);
      setBizCategory(profile.category ?? "general");
      setBizTagline(profile.tagline ?? "");
    }
  }, [token]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setMsg(null);
    loadBusinessState().catch(() => {});
  }, [open, loadBusinessState]);

  if (!open) return null;

  async function handleSaveBusiness() {
    if (!bizName.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const profile = await upsertBusinessProfile(token, {
        business_name: bizName.trim(),
        category: bizCategory,
        tagline: bizTagline.trim() || undefined,
      });
      setBusinessProfile(profile);
      setMsg(t("business.pageSaved"));
      setStep(3);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTrial() {
    setLoading(true);
    setMsg(null);
    try {
      const access = await startBusinessToolsTrial(token);
      setToolsAccess(access);
      setMsg(access.message);
      onComplete?.();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("business.trialFailed"));
    } finally {
      setLoading(false);
    }
  }

  function handleSwitchLane() {
    onSwitchLane();
    setStep(2);
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: t("business.onboardingStep1") },
    { n: 2, label: t("business.onboardingStep2") },
    { n: 3, label: t("business.onboardingStep3") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("common.cancel")}
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-[#FFB300]/30 bg-[#111111] p-5 shadow-2xl">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-[#FFB300]">{t("business.onboardingTitle")}</p>
          <p className="mt-1 text-sm text-[#F5F5F5]">{t("feed.laneBusinessFlag")}</p>
          <p className="mt-1 text-xs text-[#8A8A8A]">{t("feed.laneBusinessHint")}</p>
        </div>

        <div className="mb-5 flex gap-2">
          {steps.map((s) => (
            <div
              key={s.n}
              className={`flex-1 rounded-md border px-2 py-1.5 text-center text-[10px] ${
                step === s.n
                  ? "border-[#FFB300]/50 bg-[#FFB300]/10 text-[#FFB300]"
                  : step > s.n
                    ? "border-[#00C853]/30 text-[#00C853]"
                    : "border-[#2A2A2A] text-[#5A5A5A]"
              }`}
            >
              {s.n}. {s.label}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-[#8A8A8A]">{t("business.onboardingStep1Hint")}</p>
            <Button size="sm" onClick={handleSwitchLane}>
              {t("feed.switchToBusiness")}
            </Button>
            <div className="flex justify-between gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={onClose}>
                {t("business.onboardingSkip")}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setStep(2)}>
                {t("business.onboardingNext")}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-[#8A8A8A]">{t("shop.businessPageHint")}</p>
            <Input
              label={t("shop.businessName")}
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              placeholder={t("shop.businessNamePlaceholder")}
            />
            <Input
              label={t("shop.businessCategory")}
              value={bizCategory}
              onChange={(e) => setBizCategory(e.target.value)}
              placeholder="general, apparel, services…"
            />
            <Input
              label={t("shop.businessTagline")}
              value={bizTagline}
              onChange={(e) => setBizTagline(e.target.value)}
              placeholder={t("shop.businessTaglinePlaceholder")}
            />
            <div className="flex justify-between gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
                {t("common.back")}
              </Button>
              <Button size="sm" loading={loading} disabled={!bizName.trim()} onClick={handleSaveBusiness}>
                {businessProfile ? t("shop.updateBusiness") : t("shop.createBusiness")}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-[#8A8A8A]">{t("shop.trialOffer")}</p>
            <p className={`text-xs ${toolsAccess?.tools_allowed ? "text-[#00C853]" : "text-[#FFB300]"}`}>
              {toolsAccess?.message ?? t("shop.toolsGate")}
            </p>
            {toolsAccess?.tools_allowed ? (
              <Button size="sm" onClick={onComplete ?? onClose}>
                {t("business.onboardingFinish")}
              </Button>
            ) : (
              <Button
                size="sm"
                loading={loading}
                disabled={!businessProfile}
                onClick={handleStartTrial}
              >
                {t("shop.startTrial")}
              </Button>
            )}
            {!businessProfile && (
              <p className="text-[10px] text-[#5A5A5A]">{t("shop.needBusinessPage")}</p>
            )}
            <div className="flex justify-between gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(2)}>
                {t("common.back")}
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}

        {msg && <p className="mt-3 text-xs text-[#00E5FF]">{msg}</p>}
      </div>
    </div>
  );
}