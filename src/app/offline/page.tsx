import { WifiOff } from "lucide-react";

export const metadata = { title: "오프라인 — 광장" };

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <WifiOff className="size-10 text-muted-foreground" />
      <h1 className="text-lg font-bold">오프라인 상태입니다</h1>
      <p className="text-sm text-muted-foreground">
        네트워크 연결을 확인한 뒤 다시 시도해주세요.
      </p>
    </div>
  );
}
