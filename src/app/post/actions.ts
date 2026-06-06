"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type { LikeTarget, MediaType } from "@/lib/types";

export type MediaInput = { storage_path: string; type: MediaType };

export type PostInput = {
  body: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  occurred_at: string | null;
  tags: string[];
  media: MediaInput[];
};

/** 글 작성. 본문 + 미디어(이미 storage 업로드됨) + 태그를 함께 저장. */
export async function createPost(input: PostInput): Promise<{ id: string }> {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login?next=/post/new");

  const body = input.body.trim();
  if (!body) throw new Error("본문을 입력하세요.");

  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: userId,
      body,
      lat: input.lat,
      lng: input.lng,
      address: input.address,
      occurred_at: input.occurred_at,
    })
    .select("id")
    .single();

  if (error || !post) throw new Error(error?.message ?? "글 작성에 실패했습니다.");

  await writeMediaAndTags(post.id, input.media, input.tags);

  revalidatePath("/");
  return { id: post.id };
}

/** 본인 글 수정. 미디어/태그는 전체 교체. */
export async function updatePost(
  postId: string,
  input: PostInput,
): Promise<{ id: string }> {
  const { userId } = await getSessionUser();
  if (!userId) redirect(`/login?next=/post/${postId}/edit`);

  const body = input.body.trim();
  if (!body) throw new Error("본문을 입력하세요.");

  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({
      body,
      lat: input.lat,
      lng: input.lng,
      address: input.address,
      occurred_at: input.occurred_at,
    })
    .eq("id", postId);

  if (error) throw new Error(error.message);

  // 기존 미디어/태그 제거 후 재작성 (RLS: 본인 글만 허용)
  await supabase.from("post_media").delete().eq("post_id", postId);
  await supabase.from("post_tags").delete().eq("post_id", postId);
  await writeMediaAndTags(postId, input.media, input.tags);

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return { id: postId };
}

async function writeMediaAndTags(
  postId: string,
  media: MediaInput[],
  tags: string[],
) {
  const supabase = await createClient();

  if (media.length > 0) {
    const rows = media.map((m, i) => ({
      post_id: postId,
      storage_path: m.storage_path,
      type: m.type,
      sort_order: i,
    }));
    const { error } = await supabase.from("post_media").insert(rows);
    if (error) throw new Error(error.message);
  }

  const uniqueTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
  if (uniqueTags.length > 0) {
    const rows = uniqueTags.map((tag) => ({ post_id: postId, tag }));
    const { error } = await supabase.from("post_tags").insert(rows);
    if (error) throw new Error(error.message);
  }
}

export async function deletePost(postId: string): Promise<void> {
  const { userId } = await getSessionUser();
  if (!userId) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}

/** 좋아요 토글. 이미 누른 경우 해제, 아니면 추가. */
export async function toggleLike(
  targetType: LikeTarget,
  targetId: string,
): Promise<{ liked: boolean }> {
  const { userId } = await getSessionUser();
  if (!userId) throw new Error("로그인이 필요합니다.");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("likes").delete().eq("id", existing.id);
    if (error) throw new Error(error.message);
    revalidateForTarget(targetType, targetId);
    return { liked: false };
  }

  const { error } = await supabase
    .from("likes")
    .insert({ user_id: userId, target_type: targetType, target_id: targetId });
  if (error) throw new Error(error.message);
  revalidateForTarget(targetType, targetId);
  return { liked: true };
}

function revalidateForTarget(targetType: LikeTarget, targetId: string) {
  revalidatePath("/");
  if (targetType === "post") revalidatePath(`/post/${targetId}`);
}

export async function addComment(
  postId: string,
  parentId: string | null,
  body: string,
): Promise<void> {
  const { userId } = await getSessionUser();
  if (!userId) throw new Error("로그인이 필요합니다.");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("댓글 내용을 입력하세요.");

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: userId,
    parent_id: parentId,
    body: trimmed,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
}

export async function deleteComment(commentId: string): Promise<void> {
  const { userId } = await getSessionUser();
  if (!userId) throw new Error("로그인이 필요합니다.");

  const supabase = await createClient();

  // 어떤 글의 댓글인지 알아내 revalidate
  const { data: comment } = await supabase
    .from("comments")
    .select("post_id")
    .eq("id", commentId)
    .maybeSingle();

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);

  if (comment) revalidatePath(`/post/${comment.post_id}`);
  revalidatePath("/");
}
