"use client";

import type { Post } from "@nexus/types";
import { Button, ModeBadge, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { createPost, getFeed, getProfessionalDashboard, reportPost } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

function PostCard({ post, onReport }: { post: Post; onReport: (id: string) => void }) {
  const time = new Date(post.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] text-xs font-medium text-[#00E5FF]">
            {post.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-[#F5F5F5]">{post.author_name}</p>
            <p className="text-[10px] text-[#5A5A5A]">{time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeBadge mode={post.mode} />
          <button
            onClick={() => onReport(post.id)}
            className="text-[10px] text-[#5A5A5A] hover:text-[#FF5252] transition-colors"
          >
            Report
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[#D4D4D4] whitespace-pre-wrap">{post.body}</p>
    </article>
  );
}

export function Feed() {
  const session = useAuthStore((s) => s.session)!;
  const viewContext = session.viewContext ?? "personal";
  const feedType = useAuthStore((s) => s.feedType);
  const setFeedType = useAuthStore((s) => s.setFeedType);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [insights, setInsights] = useState<{ label: string; value: string }[]>([]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const resolvedFeedType =
        viewContext === "professional"
          ? "professional"
          : feedType === "connections"
            ? "connections"
            : "global";

      const feed = await getFeed(session.accessToken, {
        feedType: resolvedFeedType,
        context: viewContext,
      });
      setPosts(feed.posts);

      if (viewContext === "professional") {
        const dash = await getProfessionalDashboard(session.accessToken);
        setInsights(dash.insights.map((i) => ({ label: i.label, value: i.value })));
      } else {
        setInsights([]);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, viewContext, feedType]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function handleReport(postId: string) {
    try {
      await reportPost(session.accessToken, postId, "inappropriate", "User report from feed");
    } catch {
      /* silent */
    }
  }

  async function handlePost() {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await createPost(session.accessToken, {
        body: body.trim(),
        context: viewContext,
      });
      setBody("");
      setComposing(false);
      await loadFeed();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#F5F5F5]">
            {viewContext === "professional" ? "Professional Feed" : "Feed"}
          </h2>
          <p className="text-xs text-[#8A8A8A] mt-1">
            Context: <span className="text-[#00E5FF] capitalize">{viewContext}</span>
            {viewContext === "personal" && (
              <span className="ml-2">
                · {feedType === "connections" ? "Connections only" : "Global"}
              </span>
            )}
          </p>
        </div>
        <Button size="sm" onClick={() => setComposing(true)}>
          New Post
        </Button>
      </div>

      {viewContext === "personal" && (
        <div className="flex gap-2">
          {(["global", "connections"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFeedType(type)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                feedType === type
                  ? "border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF]"
                  : "border-[#2A2A2A] text-[#8A8A8A] hover:border-[#3A3A3A]"
              }`}
            >
              {type === "global" ? "Global" : "Connections"}
            </button>
          ))}
        </div>
      )}

      {viewContext === "professional" && insights.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {insights.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-3 text-center"
            >
              <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-[#4FC3F7]">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <Panel open={composing} title="Compose" onClose={() => setComposing(false)}>
        <div className="space-y-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              viewContext === "professional"
                ? "Share professional insight..."
                : "Share something with Nexus..."
            }
            rows={4}
            className="w-full resize-none rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/20"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setComposing(false)}>
              Cancel
            </Button>
            <Button loading={submitting} disabled={!body.trim()} onClick={handlePost}>
              Publish
            </Button>
          </div>
        </div>
      </Panel>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#2A2A2A] py-16 text-center">
          <p className="text-sm text-[#8A8A8A]">No posts yet. Be the first to share.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onReport={handleReport} />
          ))}
        </div>
      )}
    </div>
  );
}