// 게시글/댓글 조회 헬퍼 (서버 전용, 게시글 기능 로컬).
// likes는 posts/comments와 FK가 없어 임베드 불가 → 별도 쿼리로 집계한다.

import { createClient } from "@/lib/supabase/server";
import type {
  CommentWithRelations,
  PostWithRelations,
  PostMedia,
} from "@/lib/types";

export type FeedQuery = {
  tag?: string;
  from?: string; // ISO (created_at 하한)
  to?: string; // ISO (created_at 상한)
  userId?: string | null;
};

const POST_SELECT =
  "*, author:profiles!posts_author_id_fkey(id,nickname), media:post_media(id,post_id,storage_path,type,sort_order,created_at), tags:post_tags(tag), comments(count)";

type RawPost = {
  id: string;
  author_id: string;
  body: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  occurred_at: string | null;
  created_at: string;
  updated_at: string;
  author: { id: string; nickname: string | null } | null;
  media: PostMedia[] | null;
  tags: { tag: string }[] | null;
  comments: { count: number }[] | null;
};

async function fetchLikeInfo(
  targetType: "post" | "comment",
  ids: string[],
  userId: string | null | undefined,
): Promise<{ counts: Map<string, number>; mine: Set<string> }> {
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  if (ids.length === 0) return { counts, mine };

  const supabase = await createClient();
  const { data } = await supabase
    .from("likes")
    .select("target_id,user_id")
    .eq("target_type", targetType)
    .in("target_id", ids);

  for (const row of data ?? []) {
    counts.set(row.target_id, (counts.get(row.target_id) ?? 0) + 1);
    if (userId && row.user_id === userId) mine.add(row.target_id);
  }
  return { counts, mine };
}

function shapePost(
  raw: RawPost,
  likeCount: number,
  likedByMe: boolean,
): PostWithRelations {
  const media = [...(raw.media ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  return {
    id: raw.id,
    author_id: raw.author_id,
    body: raw.body,
    lat: raw.lat,
    lng: raw.lng,
    address: raw.address,
    occurred_at: raw.occurred_at,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    like_count: likeCount,
    comment_count: raw.comments?.[0]?.count ?? 0,
    author: raw.author ?? { id: raw.author_id, nickname: null },
    media,
    tags: (raw.tags ?? []).map((t) => t.tag),
    liked_by_me: likedByMe,
  };
}

export async function getFeed(q: FeedQuery): Promise<PostWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false });

  if (q.from) query = query.gte("created_at", q.from);
  if (q.to) query = query.lte("created_at", q.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []) as unknown as RawPost[];

  if (q.tag) {
    const tag = q.tag.toLowerCase();
    rows = rows.filter((r) =>
      (r.tags ?? []).some((t) => t.tag.toLowerCase().includes(tag)),
    );
  }

  const ids = rows.map((r) => r.id);
  const { counts, mine } = await fetchLikeInfo("post", ids, q.userId);

  return rows.map((r) => shapePost(r, counts.get(r.id) ?? 0, mine.has(r.id)));
}

export async function getPost(
  id: string,
  userId: string | null | undefined,
): Promise<PostWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const raw = data as unknown as RawPost;
  const { counts, mine } = await fetchLikeInfo("post", [id], userId);
  return shapePost(raw, counts.get(id) ?? 0, mine.has(id));
}

type RawComment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author: { id: string; nickname: string | null } | null;
};

/** 글의 댓글을 1단계 트리(부모 → replies)로 반환. */
export async function getComments(
  postId: string,
  userId: string | null | undefined,
): Promise<CommentWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:profiles!comments_author_id_fkey(id,nickname)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as RawComment[];
  const ids = rows.map((r) => r.id);
  const { counts, mine } = await fetchLikeInfo("comment", ids, userId);

  const toShape = (r: RawComment): CommentWithRelations => ({
    id: r.id,
    post_id: r.post_id,
    author_id: r.author_id,
    parent_id: r.parent_id,
    body: r.body,
    created_at: r.created_at,
    updated_at: r.updated_at,
    author: r.author ?? { id: r.author_id, nickname: null },
    like_count: counts.get(r.id) ?? 0,
    liked_by_me: mine.has(r.id),
    replies: [],
  });

  const byId = new Map<string, CommentWithRelations>();
  const roots: CommentWithRelations[] = [];

  for (const r of rows) byId.set(r.id, toShape(r));
  for (const r of rows) {
    const node = byId.get(r.id)!;
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
