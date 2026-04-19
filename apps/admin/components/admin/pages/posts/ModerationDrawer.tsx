import { useEffect } from "react";
import { createPortal } from "react-dom";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { FeedPostRow, ModerationStatus } from "./types";
import { statusLabel, statusTone } from "./posts-utils";
import { PostPreviewCard } from "./PostPreviewCard";

export function ModerationDrawer({
  post,
  open,
  onClose,
  saving,
  onUpdateStatus,
}: {
  post: FeedPostRow | null;
  open: boolean;
  onClose: () => void;
  saving?: boolean;
  onUpdateStatus: (postId: string, status: ModerationStatus) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !post) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close moderation popup"
        className="absolute inset-0 bg-black/28 backdrop-blur-[4px]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <aside className="flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-[920px] flex-col rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/95 shadow-[0_30px_80px_rgba(33,49,30,0.22)] sm:max-h-[calc(100vh-2rem)]">
          <div className="flex items-center justify-between gap-3 border-b border-[color:rgba(31,41,22,0.08)] bg-white/70 px-5 py-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Moderation desk
            </div>
            <div className="mt-1 truncate text-lg font-semibold text-[var(--color-heading)]">{post.id}</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone={statusTone(post.status)}>{statusLabel(post.status)}</StatusBadge>
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <PostPreviewCard post={post} />

          <div className="mt-5 rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-5 shadow-[0_16px_30px_rgba(33,49,30,0.07)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Actions
                </div>
                <div className="mt-1 text-lg font-semibold text-[var(--color-heading)]">Quyết định cho bài đăng</div>
              </div>
              <StatusBadge tone="info">{saving ? "Saving..." : "API: publish/hide"}</StatusBadge>
            </div>

            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              NEEDS_REVIEW / FLAGGED hiện là tag nội bộ (không lưu backend). Publish/Hide sẽ lưu vào backend.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => onUpdateStatus(post.id, "PUBLISHED")}
              >
                Approve + publish
              </button>
              <button
                type="button"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => onUpdateStatus(post.id, "NEEDS_REVIEW")}
              >
                Move to review
              </button>
              <button
                type="button"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(163,69,45,0.24)] bg-[rgba(253,244,241,0.92)] px-4 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[rgba(253,244,241,1)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => onUpdateStatus(post.id, "HIDDEN")}
              >
                Hide from feed
              </button>
              <button
                type="button"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => onUpdateStatus(post.id, "FLAGGED")}
              >
                Flag for follow-up
              </button>
            </div>

            <div className="mt-4">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Moderation note
              </label>
              <textarea
                rows={3}
                placeholder="Ghi chú nội bộ: lý do hide, guideline áp dụng, cần theo dõi..."
                disabled
                className="mt-2 w-full cursor-not-allowed rounded-[1.35rem] border border-[color:rgba(31,41,22,0.12)] bg-white/70 px-4 py-3 text-sm text-[var(--color-heading)] outline-none transition-colors placeholder:text-[var(--color-muted)]"
              />
              <div className="mt-2 text-sm text-[var(--color-muted)]">Chưa có persistence cho moderation note trong schema.</div>
            </div>
          </div>
        </div>

          <div className="flex items-center justify-between gap-3 border-t border-[color:rgba(31,41,22,0.08)] bg-white/70 px-5 py-4">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-white"
            onClick={onClose}
          >
            Close
          </button>
          <div className="text-xs text-[var(--color-muted)]">Press ESC to close</div>
          </div>
        </aside>
      </div>
    </div>,
    document.body,
  );
}
