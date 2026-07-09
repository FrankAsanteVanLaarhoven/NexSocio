"use client";

import { Button, Input, ModeBadge, Panel } from "@nexus/ui";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { SecuritySetup } from "@/components/auth/SecuritySetup";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { getMe, updateProfile } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { UserProfile } from "@nexus/types";

export default function ProfilePage() {
  const session = useAuthStore((s) => s.session);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
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
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"))
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
      setError(e instanceof Error ? e.message : "Save failed");
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
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Profile & Settings</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">Manage your Nexus identity</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : (
          <Panel open title="Your Profile">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-[#1F1F1F]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-lg font-bold text-[#00E5FF]">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F5F5F5]">{displayName}</p>
                  <p className="text-xs text-[#8A8A8A]">{profile?.email}</p>
                  {profile && <ModeBadge mode={profile.mode} className="mt-1" />}
                </div>
              </div>

              <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <Input label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell your story..." />
              <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Senior Engineer @ Nexus" />
              <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <Input label="Skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Rust, ML, Robotics" />

              {profile?.age_verified && (
                <div className="rounded-md border border-[#00C853]/30 bg-[#00C853]/5 px-3 py-2">
                  <p className="text-xs text-[#00C853]">✓ Age verified via ZKP</p>
                </div>
              )}

              {error && <p className="text-xs text-[#FF5252]">{error}</p>}
              {success && <p className="text-xs text-[#00C853]">Profile saved successfully</p>}

              <Button className="w-full" loading={saving} onClick={handleSave}>
                Save Changes
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