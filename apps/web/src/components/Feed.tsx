"use client";

import type { Comment, Post } from "@nexus/types";
import { Button, Input, ModeBadge, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import {
  composeWithAI,
  createComment,
  createPost,
  getComments,
  getFeed,
  getMe,
  getProfessionalDashboard,
  reportPost,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useSettingsStore } from "@/lib/settings-store";

function PostCard({
  post,
  token,
  onReport,
}: {
  post: Post;
  token: string;
  onReport: (id: string) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [commentMsg, setCommentMsg] = useState<string | null>(null);
  const likes = useSettingsStore((s) => s.likes);
  const toggleLike = useSettingsStore((s) => s.toggleLike);
  const liked = likes.includes(post.id);
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
            <p className="text-[10px] text-[#5A5A5A]">
              {time}
              {post.post_type && post.post_type !== "text" && (
                <span className="ml-2 text-[#7C4DFF]">· {post.post_type}</span>
              )}
              {post.is_twin_post && <span className="ml-2 text-[#00E5FF]">· twin</span>}
              {post.show_ai_tag && (
                <span className="ml-2 text-[#7C4DFF] font-medium">· NEXSOCIO AI</span>
              )}
            </p>
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
      {post.media_url && post.post_type !== "text" && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[#2A2A2A]">
          {post.media_url.startsWith("data:video") || post.post_type === "reel" ? (
            <video
              src={post.media_url}
              controls
              playsInline
              className="w-full max-h-80 object-cover bg-black"
            />
          ) : post.media_url.startsWith("data:image") ? (
            <img src={post.media_url} alt="" className="w-full max-h-80 object-cover" />
          ) : (
            <p className="p-3 text-[10px] text-[#5A5A5A]">
              📎 {post.post_type} {post.filter_preset ? `· ${post.filter_preset} filter` : ""}
            </p>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center gap-4 border-t border-[#1F1F1F] pt-3">
        <button
          type="button"
          onClick={() => toggleLike(post.id)}
          className={`text-xs transition-colors ${liked ? "text-[#FF5252]" : "text-[#5A5A5A] hover:text-[#F5F5F5]"}`}
        >
          {liked ? "♥ Liked" : "♡ Like"}
        </button>
        <button
          type="button"
          onClick={async () => {
            setShowComments(!showComments);
            if (!showComments) setComments(await getComments(post.id));
          }}
          className="text-xs text-[#5A5A5A] hover:text-[#F5F5F5]"
        >
          Comment
        </button>
        <button type="button" className="text-xs text-[#5A5A5A] hover:text-[#FFB300]">
          Promote
        </button>
      </div>
      {showComments && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <p key={c.id} className="text-xs text-[#8A8A8A] pl-2 border-l border-[#2A2A2A]">
              <span className="text-[#F5F5F5]">{c.author_name}:</span> {c.body}
              {c.moderation_status === "pending" && (
                <span className="ml-2 text-[#FFB300]">· pending review</span>
              )}
            </p>
          ))}
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Add comment (moderated before publish)..."
            />
            <Button
              size="sm"
              onClick={async () => {
                if (!commentBody.trim()) return;
                const c = await createComment(token, post.id, commentBody.trim());
                setCommentMsg(
                  c.moderation_status === "pending"
                    ? "Comment submitted for review"
                    : "Comment posted"
                );
                setCommentBody("");
                setComments(await getComments(post.id));
              }}
            >
              Send
            </Button>
          </div>
          {commentMsg && <p className="text-[10px] text-[#8A8A8A]">{commentMsg}</p>}
        </div>
      )}
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
  const [aiComposing, setAiComposing] = useState(false);
  const [usedAi, setUsedAi] = useState(false);
  const [hideAiTag, setHideAiTag] = useState(false);
  const [canHideAiTag, setCanHideAiTag] = useState(false);
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

  useEffect(() => {
    getMe(session.accessToken)
      .then((me) => setCanHideAiTag(!!me.can_hide_ai_tag))
      .catch(() => setCanHideAiTag(false));
  }, [session.accessToken]);

  async function handleReport(postId: string) {
    try {
      await reportPost(session.accessToken, postId, "inappropriate", "User report from feed");
    } catch {
      /* silent */
    }
  }

  async function handleAiCompose() {
    if (!body.trim()) return;
    setAiComposing(true);
    try {
      const result = await composeWithAI(session.accessToken, body.trim(), {
        tone: viewContext === "professional" ? "professional" : "friendly",
        context: viewContext === "professional" ? "professional" : "social",
      });
      setBody(result.composed);
      setUsedAi(true);
    } finally {
      setAiComposing(false);
    }
  }

  async function handlePost() {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await createPost(session.accessToken, {
        body: body.trim(),
        context: viewContext,
        ai_assisted: usedAi,
        hide_ai_tag: usedAi && canHideAiTag && hideAiTag,
      });
      setBody("");
      setUsedAi(false);
      setHideAiTag(false);
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

      <Panel
        open={composing}
        title="Compose"
        subtitle={usedAi ? "Tagged NEXSOCIO AI unless you hide it (Premium/Business)" : undefined}
        onClose={() => {
          setComposing(false);
          setUsedAi(false);
          setHideAiTag(false);
        }}
      >
        <div className="space-y-4">
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (usedAi) setUsedAi(false);
            }}
            placeholder={
              viewContext === "professional"
                ? "Share professional insight..."
                : "Share something with NEXSOCIO..."
            }
            rows={4}
            className="w-full resize-none rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/20"
          />
          {usedAi && (
            <div className="flex items-center gap-2 rounded-md border border-[#7C4DFF]/30 bg-[#7C4DFF]/5 px-3 py-2">
              <span className="text-[10px] uppercase tracking-wider text-[#7C4DFF]">NEXSOCIO AI</span>
              {canHideAiTag ? (
                <label className="ml-auto flex items-center gap-2 text-xs text-[#8A8A8A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideAiTag}
                    onChange={(e) => setHideAiTag(e.target.checked)}
                    className="accent-[#7C4DFF]"
                  />
                  Hide tag (Premium/Business)
                </label>
              ) : (
                <span className="ml-auto text-[10px] text-[#8A8A8A]">
                  Visible to all · upgrade to hide
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={aiComposing}
              disabled={!body.trim()}
              onClick={handleAiCompose}
            >
              Compose with NEXSOCIO AI
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setComposing(false);
                  setUsedAi(false);
                  setHideAiTag(false);
                }}
              >
                Cancel
              </Button>
              <Button loading={submitting} disabled={!body.trim()} onClick={handlePost}>
                Publish
              </Button>
            </div>
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
              <PostCard key={post.id} post={post} token={session.accessToken} onReport={handleReport} />
          ))}
        </div>
      )}
    </div>
  );
}