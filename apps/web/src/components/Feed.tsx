"use client";

import type { Comment, Post } from "@nexus/types";
import { Button, Input, ModeBadge, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import {
  createComment,
  createPost,
  getComments,
  getFeed,
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
        <p className="mt-2 text-[10px] text-[#5A5A5A]">
          📎 {post.post_type} {post.filter_preset ? `· ${post.filter_preset} filter` : ""}
        </p>
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
                : "Share something with NEXSOCIO..."
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
              <PostCard key={post.id} post={post} token={session.accessToken} onReport={handleReport} />
          ))}
        </div>
      )}
    </div>
  );
}