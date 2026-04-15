"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { FeedPostRow } from "./types";
import { postTypeLabel, statusLabel, statusTone } from "./posts-utils";

export function PostPreviewCard({ post }: { post: FeedPostRow }) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const initials = post.authorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const imageSrc = useMemo(() => post.imageUrl?.trim() ?? "", [post.imageUrl]);
  const hasImage = imageSrc.length > 0;

  useEffect(() => {
    setIsImageOpen(false);
  }, [post.id]);

  useEffect(() => {
    if (!isImageOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsImageOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isImageOpen]);

  return (
    <>
      <article className="overflow-hidden rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white shadow-[0_18px_44px_rgba(33,49,30,0.08)]">
      <div className="border-b border-[color:rgba(31,41,22,0.08)] bg-white/90 px-5 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-interactive-bg)] font-bold text-[var(--color-green-deep)]">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-[var(--color-heading)]">{post.authorName}</div>
                {post.authorVerifiedGrower ? <StatusBadge tone="success">Verified grower</StatusBadge> : null}
              </div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">
                {post.createdAtLabel} • {post.authorDistrict} • Visibility: {post.visibilityDistrict ?? "All"}
              </div>
            </div>
          </div>
          <StatusBadge tone={statusTone(post.status)}>{statusLabel(post.status)}</StatusBadge>
        </div>
      </div>

      {hasImage ? (
        <div className="relative h-52 bg-[linear-gradient(135deg,rgba(121,150,94,0.14),rgba(205,146,74,0.14))]">
          <button
            type="button"
            onClick={() => setIsImageOpen(true)}
            className="group relative h-full w-full"
            aria-label="Open post image"
          >
            <img
              src={imageSrc}
              alt={`Post image from ${post.authorName}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
              <span className="rounded-full border border-white/40 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                View image
              </span>
            </div>
          </button>
        </div>
      ) : null}

      <div className="px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="neutral">{postTypeLabel(post.postType)}</StatusBadge>
          {post.signals.reports > 0 ? <StatusBadge tone="danger">{post.signals.reports} reports</StatusBadge> : null}
          <StatusBadge tone="info">{post.signals.likes} likes</StatusBadge>
          <StatusBadge tone="info">{post.signals.comments} comments</StatusBadge>
        </div>

        <div className="mt-4 text-sm leading-7 text-[var(--color-heading)]">{post.caption}</div>

        {post.riskNotes.length ? (
          <div className="mt-5 rounded-[1.35rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Signals</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {post.riskNotes.map((note) => (
                <span
                  key={note}
                  className="inline-flex items-center rounded-full border border-[color:rgba(163,69,45,0.24)] bg-[rgba(253,244,241,0.9)] px-3 py-1 text-xs font-semibold text-[var(--color-danger)]"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      </article>

      {isImageOpen && hasImage
        ? createPortal(
            <div className="fixed inset-0 z-[100]">
              <button
                type="button"
                className="absolute inset-0 bg-black/78 backdrop-blur-[2px]"
                onClick={() => setIsImageOpen(false)}
                aria-label="Close image viewer"
              />
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <div className="relative w-full max-w-[1100px]">
                  <img
                    src={imageSrc}
                    alt={`Post image from ${post.authorName}`}
                    className="max-h-[88vh] w-full rounded-[1.2rem] object-contain shadow-[0_26px_60px_rgba(0,0,0,0.45)]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsImageOpen(false)}
                    className="absolute right-3 top-3 inline-flex min-h-9 items-center justify-center rounded-full border border-white/30 bg-black/45 px-3 text-sm font-semibold text-white transition-colors hover:bg-black/65"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
