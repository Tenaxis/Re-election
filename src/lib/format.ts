// 공용 포맷 유틸 (모든 기능 영역에서 사용)

const REL = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

/** 상대 시간: "방금 전", "3분 전", "2일 전" */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = then - Date.now();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (Math.abs(sec) < 60) return "방금 전";
  if (Math.abs(min) < 60) return REL.format(min, "minute");
  if (Math.abs(hr) < 24) return REL.format(hr, "hour");
  if (Math.abs(day) < 7) return REL.format(day, "day");
  return formatDate(iso);
}

/** 날짜: "2026. 6. 7." */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** 날짜+시간: "6월 7일 (토) 오후 2:30" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** datetime-local input 값으로 변환 */
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

/** 닉네임 이니셜(아바타 폴백) */
export function initial(nickname: string | null | undefined): string {
  return (nickname ?? "?").trim().charAt(0).toUpperCase() || "?";
}
