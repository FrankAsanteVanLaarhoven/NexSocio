"use client";

import { Button, Panel } from "@nexus/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { readArticleInApp } from "@/lib/api";
import type { ArticlePreview } from "@nexus/types";

function ReadContent() {
  const params = useSearchParams();
  const router = useRouter();
  const url = params.get("url") || "";
  const [article, setArticle] = useState<ArticlePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setError("No article URL");
      setLoading(false);
      return;
    }
    setLoading(true);
    readArticleInApp(url)
      .then(setArticle)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [url]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
        <p className="text-[10px] text-[#5A5A5A] uppercase tracking-wider">In-app reader</p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
        </div>
      )}

      {error && (
        <Panel open title="Could not load">
          <p className="text-sm text-[#8A8A8A]">{error}</p>
        </Panel>
      )}

      {article && (
        <Panel open title={article.title} subtitle={`${article.publisher} · NEXSOCIO Reader`}>
          <article
            className="prose-invert text-sm leading-relaxed text-[#D4D4D4] space-y-3 [&_a]:text-[#00E5FF] [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: article.content_html }}
          />
          <p className="text-[10px] text-[#5A5A5A] mt-6 pt-4 border-t border-[#1F1F1F]">
            Source: {article.source_url}
          </p>
        </Panel>
      )}
    </div>
  );
}

export default function ReadPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="py-20 text-center text-xs text-[#5A5A5A]">Loading…</div>}>
        <ReadContent />
      </Suspense>
    </AppShell>
  );
}