import Link from "next/link";
import {
  Users,
  Utensils,
  AlertTriangle,
  Trash2,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import type { SupportRequest, SupportType, SupportStatus } from "@/lib/types";

export const SUPPORT_TYPE_META: Record<
  SupportType,
  { label: string; icon: LucideIcon }
> = {
  manpower: { label: "위치(인력)", icon: Users },
  food: { label: "음식", icon: Utensils },
  hazard: { label: "분신물 신고", icon: AlertTriangle },
  cleanup: { label: "현장 정리", icon: Trash2 },
};

export const SUPPORT_STATUS_META: Record<
  SupportStatus,
  { label: string; variant: "warning" | "info" | "success" }
> = {
  open: { label: "요청중", variant: "warning" },
  in_progress: { label: "진행중", variant: "info" },
  done: { label: "완료", variant: "success" },
};

export function SupportCard({ support }: { support: SupportRequest }) {
  const type = SUPPORT_TYPE_META[support.type];
  const status = SUPPORT_STATUS_META[support.status];
  const TypeIcon = type.icon;

  return (
    <Card className="transition-colors hover:border-border-strong hover:shadow-sm">
      <Link
        href={`/support/${support.id}`}
        className="block rounded-lg p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline">
            <TypeIcon className="size-3.5" aria-hidden />
            {type.label}
          </Badge>
          <Badge variant={status.variant} className="shrink-0">
            {status.label}
          </Badge>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground">
          {support.body}
        </p>

        <dl className="mt-3 space-y-1.5 text-sm text-text-2">
          {support.address ? (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <dt className="sr-only">위치</dt>
              <dd className="line-clamp-1">{support.address}</dd>
            </div>
          ) : null}
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(support.created_at)}
          </div>
        </dl>
      </Link>
    </Card>
  );
}
