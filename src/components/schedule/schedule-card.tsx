import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { Schedule } from "@/lib/types";

export function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const period = schedule.ends_at
    ? `${formatDateTime(schedule.starts_at)} ~ ${formatDateTime(schedule.ends_at)}`
    : formatDateTime(schedule.starts_at);

  return (
    <Card className="transition-colors hover:border-border-strong hover:shadow-sm">
      <Link
        href={`/schedule/${schedule.id}`}
        className="block rounded-lg p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug">{schedule.name}</h3>
          {schedule.is_reported ? (
            <Badge variant="success" className="shrink-0">
              신고 완료
            </Badge>
          ) : (
            <Badge variant="warning" className="shrink-0">
              미신고
            </Badge>
          )}
        </div>

        <dl className="mt-3 space-y-1.5 text-sm text-text-2">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <dt className="sr-only">일시</dt>
            <dd>{period}</dd>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <dt className="sr-only">장소</dt>
            <dd className="line-clamp-2">{schedule.address}</dd>
          </div>
        </dl>
      </Link>
    </Card>
  );
}
