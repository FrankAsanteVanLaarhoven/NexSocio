"use client";

import { Button, Input, ModeBadge, Panel } from "@nexus/ui";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { SecuritySetup } from "@/components/auth/SecuritySetup";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { MediaUploader } from "@/components/MediaUploader";
import { getMe, updateProfile } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { resolveMediaUrl } from "@/lib/media-formats";
import { useSettingsStore } from "@/lib/settings-store";
import { useTranslation } from "@/i18n";
import type { UserProfile } from "@nexus/types";

export default function ProfilePage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const profileMediaUrl = useSettingsStore((s) => s.profileMediaUrl);
  const businessMediaUrl = useSettingsStore((s) => s.businessMediaUrl);
  const updateSettings = useSettingsStore((s) => s.update);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [company, setCompany] = useState("");
  const [skills, setSkills] = useState("");

  useEffect(() => {
    if (!session) return;
    getMe(session.accessToken)
      .then((p) => {
        setProfile(p);
        setDisplayName(p.display_name);
        setBio(p.bio || "");
        setHeadline(p.headline || "");
        setCompany(p.company || "");
        setSkills(p.skills || "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("profile.loadFailed")))
      .finally(() => setLoading(false));
  }, [session]);

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateProfile(session.accessToken, {
        display_name: displayName,
        bio,
        headline,
        company,
        skills,
      });
      setProfile(updated);
      updateDisplayName(updated.display_name);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("profile.title")}</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">{t("profile.subtitle")}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : (
          <Panel open title={t("profile.yourProfile")}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-[#1F1F1F]">
                {profileMediaUrl ? (
                  <img
                    src={resolveMediaUrl(profileMediaUrl)}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover border border-[#00E5FF]/30"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-lg font-bold text-[#00E5FF]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[#F5F5F5]">{displayName}</p>
                  <p className="text-xs text-[#8A8A8A]">{profile?.email}</p>
                  {profile && <ModeBadge mode={profile.mode} className="mt-1" />}
                </div>
              </div>

              <Input label={t("profile.displayName")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <Input label={t("profile.bio")} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("profile.bioPlaceholder")} />
              <Input label={t("profile.headline")} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={t("profile.headlinePlaceholder")} />
              <Input label={t("profile.company")} value={company} onChange={(e) => setCompany(e.target.value)} />
              <Input label={t("profile.skills")} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder={t("profile.skillsPlaceholder")} />

              {profile?.age_verified && (
                <div className="rounded-md border border-[#00C853]/30 bg-[#00C853]/5 px-3 py-2">
                  <p className="text-xs text-[#00C853]">{t("profile.ageVerified")}</p>
                </div>
              )}

              {session && (
                <>
                  <MediaUploader
                    context="avatar"
                    token={session.accessToken}
                    label={t("profile.profilePhotoLabel")}
                    previewUrl={profileMediaUrl}
                    onUploaded={(m) => updateSettings({ profileMediaUrl: m.url })}
                    onClear={() => updateSettings({ profileMediaUrl: null })}
                    compact
                  />
                  <MediaUploader
                    context="business"
                    token={session.accessToken}
                    label={t("profile.businessPromoLabel")}
                    previewUrl={businessMediaUrl}
                    onUploaded={(m) => updateSettings({ businessMediaUrl: m.url })}
                    onClear={() => updateSettings({ businessMediaUrl: null })}
                    compact
                  />
                </>
              )}

              {error && <p className="text-xs text-[#FF5252]">{error}</p>}
              {success && <p className="text-xs text-[#00C853]">{t("profile.saveSuccess")}</p>}

              <Button className="w-full" loading={saving} onClick={handleSave}>
                {t("profile.saveChanges")}
              </Button>
            </div>
          </Panel>
        )}

        <SecuritySetup />
      </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}