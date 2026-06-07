import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PostComposer } from "@/components/post/post-composer";
import { postToInitial } from "@/components/post/composer-types";
import { getPost } from "@/components/post/queries";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await getSessionUser();
  if (!userId) redirect(`/login?next=/post/${id}/edit`);

  const post = await getPost(id, userId);
  if (!post) notFound();
  if (post.author_id !== userId) redirect(`/post/${id}`);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">글 수정</h1>
      <PostComposer userId={userId} initial={postToInitial(post)} />
    </div>
  );
}
