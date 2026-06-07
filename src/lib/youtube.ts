// 유튜브 링크 파서 + 임베드 URL 빌더 (YouTube Data API 미사용, 순수 함수).
//
// 지원: watch?v=ID · youtu.be/ID · /live/ID · /embed/ID · /shorts/ID · 11자 video id
//       /channel/UC... (현재 라이브 자동 추종) · 26자 channel id
// 미지원: @handle, /c/, /user/ → 채널ID 변환에 API 필요.

export type YoutubeSourceType = "video" | "channel";
export type YoutubeSource = { sourceType: YoutubeSourceType; ref: string };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

/** 입력 문자열에서 video/channel 소스를 파싱. 실패 시 null. */
export function parseYoutube(input: string): YoutubeSource | null {
  const raw = input.trim();
  if (!raw) return null;

  // 순수 ID 입력
  if (VIDEO_ID.test(raw)) return { sourceType: "video", ref: raw };
  if (CHANNEL_ID.test(raw)) return { sourceType: "channel", ref: raw };

  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const isYt =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com";
  if (!isYt) return null;

  // youtu.be/ID
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return VIDEO_ID.test(id) ? { sourceType: "video", ref: id } : null;
  }

  const parts = url.pathname.split("/").filter(Boolean);

  // watch?v=ID
  const v = url.searchParams.get("v");
  if (v && VIDEO_ID.test(v)) return { sourceType: "video", ref: v };

  // /embed/live_stream?channel=UC...
  if (parts[0] === "embed" && parts[1] === "live_stream") {
    const ch = url.searchParams.get("channel");
    if (ch && CHANNEL_ID.test(ch)) return { sourceType: "channel", ref: ch };
  }

  // /live/ID · /embed/ID · /shorts/ID · /v/ID
  if (parts.length >= 2 && ["live", "embed", "shorts", "v"].includes(parts[0])) {
    if (VIDEO_ID.test(parts[1])) return { sourceType: "video", ref: parts[1] };
  }

  // /channel/UC... (뒤에 /live 등 붙어도 무방)
  if (parts[0] === "channel" && parts[1] && CHANNEL_ID.test(parts[1])) {
    return { sourceType: "channel", ref: parts[1] };
  }

  // @handle, /c/, /user/ → 미지원
  return null;
}

/** 멀티뷰용 임베드 URL. 기본 음소거 자동재생 + IFrame API 활성화. */
export function youtubeEmbedUrl(
  src: YoutubeSource,
  opts: { autoplay?: boolean; mute?: boolean } = {},
): string {
  const p = new URLSearchParams({
    autoplay: opts.autoplay === false ? "0" : "1",
    mute: opts.mute === false ? "0" : "1",
    playsinline: "1",
    enablejsapi: "1",
    rel: "0",
  });
  if (src.sourceType === "channel") {
    p.set("channel", src.ref);
    return `https://www.youtube.com/embed/live_stream?${p.toString()}`;
  }
  return `https://www.youtube.com/embed/${src.ref}?${p.toString()}`;
}

/** video 소스의 썸네일 URL (channel은 null — 미리보기 이미지 없음). */
export function youtubeThumbnail(src: YoutubeSource): string | null {
  return src.sourceType === "video"
    ? `https://i.ytimg.com/vi/${src.ref}/hqdefault.jpg`
    : null;
}
