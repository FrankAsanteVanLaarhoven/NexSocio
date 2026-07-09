"use client";

import Image from "next/image";
import { Panel } from "@nexus/ui";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { inviteUrl } from "@/lib/site";
import { useAuthStore } from "@/lib/auth-store";

export default function ShareSettingsPage() {
  const userId = useAuthStore((s) => s.session?.userId ?? "invite");
  const inviteLink = inviteUrl(userId.slice(0, 8));

  return (
    <SettingsSectionShell section="share">
      <Panel open title="Invite friends">
        <p className="text-xs text-[#8A8A8A] mb-2">Share your link — earn bonus coins when friends join.</p>
        <div className="rounded-md border border-[#2A2A2A] px-3 py-2 text-xs text-[#00E5FF] break-all">{inviteLink}</div>
        <button type="button" className="mt-2 text-xs text-[#F5F5F5] hover:text-[#00E5FF]">Copy link</button>
      </Panel>
      <Panel open title="QR invite">
        <p className="text-xs text-[#8A8A8A] mb-3">Scan to open NexSocio on mobile.</p>
        <div className="mx-auto w-fit rounded-lg border border-[#2A2A2A] bg-white p-2">
          <Image
            src="/qr-nexsocio.png"
            alt="QR code for nexsocio.com"
            width={160}
            height={160}
            className="h-40 w-40"
            priority
          />
        </div>
        <a
          href="/qr-nexsocio.png"
          download="nexsocio-qr.png"
          className="mt-3 block text-center text-xs text-[#F5F5F5] hover:text-[#00E5FF]"
        >
          Download QR
        </a>
      </Panel>
    </SettingsSectionShell>
  );
}