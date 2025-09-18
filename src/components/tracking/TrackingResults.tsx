"use client"

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrackingResult } from "@/lib/tracking/data";
import { MapPin, PackageCheck, Truck } from "lucide-react";
import TrackingMap from "@/components/tracking/TrackingMap";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const statusIcon: Record<string, React.ReactNode> = {
  "배송완료": <PackageCheck className="size-4" />,
  "배송출발": <Truck className="size-4" />,
};

export default function TrackingResults({ result }: { result: TrackingResult | null }) {
  if (!result) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        조회 결과가 없습니다. 운송장 번호와 택배사를 확인해 주세요.
      </Card>
    );
  }

  const latest = result.history[result.history.length - 1];

  return (
    <div className="grid gap-6">
      <Card className="p-6 grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">{result.carrierName}</div>
            <div className="text-sm text-muted-foreground">운송장 {result.trackingNumber}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{result.currentStatus}</Badge>
            {result.estimatedDelivery && (
              <Badge variant="outline">예상 배송 {new Date(result.estimatedDelivery).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit" })}</Badge>
            )}
          </div>
        </div>
        {(result.sender || result.recipient) && (
          <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
            {result.sender && (
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> 출발지: {result.sender}</span>
            )}
            {result.recipient && (
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> 도착지: {result.recipient}</span>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-[minmax(240px,300px)_1fr]">
        <Card className="p-0">
          <div className="p-4 text-sm font-medium">배송 이력</div>
          <Separator />
          <ol className="p-4">
            {result.history.map((ev, idx) => {
              const isLast = idx === result.history.length - 1;
              return (
                <li key={idx} className="relative pl-6 py-3">
                  <span className={`absolute left-0 top-4 -translate-y-1/2 size-3 rounded-full ${isLast ? "bg-primary" : "bg-muted-foreground/50"}`} />
                  {!isLast && (
                    <span className="absolute left-1 top-4 h-full w-px bg-border translate-y-3" />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">{formatTime(ev.time)}</span>
                    <span className="font-medium">{ev.status}</span>
                    <span className="text-muted-foreground">· {ev.location}</span>
                    <span className="text-primary/70">{statusIcon[ev.status] ?? null}</span>
                  </div>
                  {ev.note && <div className="text-xs text-muted-foreground ml-28 mt-1">{ev.note}</div>}
                </li>
              );
            })}
          </ol>
        </Card>
        <Card className="p-0">
          <div className="p-4 text-sm font-medium">배송 경로 지도</div>
          <Separator />
          <div className="p-2">
            <TrackingMap history={result.history} />
          </div>
        </Card>
      </div>

      {latest?.status === "배송완료" && (
        <Card className="p-4 text-sm">배송이 완료되었습니다. 이용해 주셔서 감사합니다.</Card>
      )}
    </div>
  );
}