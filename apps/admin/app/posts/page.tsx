import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostsModerationPageClient } from "@/components/admin/pages/posts/PostsModerationPageClient";
import { requireAdminUser } from "@/lib/auth-server";
import { getAdminPosts } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Posts",
};

export default async function PostsPage() {
  await requireAdminUser();

  let posts = [] as Awaited<ReturnType<typeof getAdminPosts>>;
  let initialError: string | undefined;

  try {
    posts = await getAdminPosts();
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Failed to load admin posts.";
  }

  return (
    <AdminShell
      active="posts"
      title="Newsfeed Moderation Desk"
      description="Giao diện compact cho moderation: ưu tiên scan nhanh, thao tác hàng loạt và mở preview đúng ngữ cảnh user-facing."
    >
      <PostsModerationPageClient initialPosts={posts} initialError={initialError} />
    </AdminShell>
  );
}
