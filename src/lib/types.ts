// Supabase DB 타입 (스키마와 수동 동기화 — DB 적용 후 `supabase gen types`로 대체 가능)

export type Role = "user" | "admin";
export type MediaType = "image" | "video";
export type LikeTarget = "post" | "comment";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; nickname: string | null; role: Role; created_at: string };
        Insert: { id: string; nickname?: string | null; role?: Role; created_at?: string };
        Update: { id?: string; nickname?: string | null; role?: Role; created_at?: string };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string; author_id: string; body: string;
          lat: number | null; lng: number | null; address: string | null;
          occurred_at: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; author_id: string; body: string;
          lat?: number | null; lng?: number | null; address?: string | null;
          occurred_at?: string | null; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: [];
      };
      post_media: {
        Row: { id: string; post_id: string; storage_path: string; type: MediaType; sort_order: number; created_at: string };
        Insert: { id?: string; post_id: string; storage_path: string; type: MediaType; sort_order?: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["post_media"]["Insert"]>;
        Relationships: [];
      };
      post_tags: {
        Row: { post_id: string; tag: string };
        Insert: { post_id: string; tag: string };
        Update: Partial<{ post_id: string; tag: string }>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string; post_id: string; author_id: string; parent_id: string | null;
          body: string; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; post_id: string; author_id: string; parent_id?: string | null;
          body: string; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      likes: {
        Row: { id: string; user_id: string; target_type: LikeTarget; target_id: string; created_at: string };
        Insert: { id?: string; user_id: string; target_type: LikeTarget; target_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["likes"]["Insert"]>;
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string; author_id: string; name: string; starts_at: string; ends_at: string | null;
          lat: number | null; lng: number | null; address: string; is_reported: boolean;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; author_id: string; name: string; starts_at: string; ends_at?: string | null;
          lat?: number | null; lng?: number | null; address: string; is_reported?: boolean;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["schedules"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      post_feed: {
        Row: {
          id: string; author_id: string; body: string;
          lat: number | null; lng: number | null; address: string | null;
          occurred_at: string | null; created_at: string; updated_at: string;
          like_count: number; comment_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ── 편의 타입 ──────────────────────────────
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostMedia = Database["public"]["Tables"]["post_media"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];
export type Schedule = Database["public"]["Tables"]["schedules"]["Row"];
export type PostFeedRow = Database["public"]["Views"]["post_feed"]["Row"];

// 조인된 화면용 타입
export type PostWithRelations = PostFeedRow & {
  author: Pick<Profile, "id" | "nickname">;
  media: PostMedia[];
  tags: string[];
  liked_by_me?: boolean;
};

export type CommentWithRelations = Comment & {
  author: Pick<Profile, "id" | "nickname">;
  like_count: number;
  liked_by_me?: boolean;
  replies?: CommentWithRelations[];
};
