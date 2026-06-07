// 서버/클라이언트 공용 타입·매퍼. "use client"가 아니므로 서버 컴포넌트에서
// postToInitial()을 직접 호출할 수 있다. (client 모듈의 일반 함수는 서버에서 호출 불가)

import type { PostWithRelations } from "@/lib/types";

export type ComposerInitial = {
  id: string;
  body: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  occurred_at: string | null;
  tags: string[];
};

export function postToInitial(post: PostWithRelations): ComposerInitial {
  return {
    id: post.id,
    body: post.body,
    address: post.address,
    lat: post.lat,
    lng: post.lng,
    occurred_at: post.occurred_at,
    tags: post.tags,
  };
}
