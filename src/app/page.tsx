"use client";

import React, { useState } from "react";
import TrackingSearch from "@/components/tracking/TrackingSearch";
import TrackingResults from "@/components/tracking/TrackingResults";
import { Card } from "@/components/ui/card";
import { type CarrierCode, type TrackingResult } from "@/lib/tracking/data";

export default function Home() {
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [queried, setQueried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch({ carrier, trackingNumber }: {carrier: CarrierCode;trackingNumber: string;}) {
    try {
      setError(null);
      const token = (typeof window !== "undefined" && localStorage.getItem("bearer_token")) || "";
      const res = await fetch(`/api/tracking?carrier=${carrier}&trackingNumber=${encodeURIComponent(trackingNumber)}` , {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setResult(null);
        setError(data?.message || "조회 중 오류가 발생했습니다.");
      } else {
        const data: TrackingResult = await res.json();
        setResult(data ?? null);
      }
    } catch (e) {
      setResult(null);
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setQueried(true);
    }
  }

  return (
    <div className="min-h-screen">
      <section className="relative isolate overflow-hidden">
        <div className="container mx-auto max-w-3xl px-4 pt-14 pb-8 sm:pt-20 sm:pb-10 grid gap-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">택배 조회 서비스</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            국내 주요 택배사(CJ대한통운 · 롯데택배 · 한진택배)의 운송장 번호로 현재 위치와 배송 상태를 확인하세요.
          </p>
          <Card className="p-4">
            <TrackingSearch onSearch={handleSearch} />
          </Card>
          {!queried &&
          <Card className="p-6 text-sm">
              예시: CJ대한통운 123456789012 · 롯데 876543210987 · 한진 110022003300
            </Card>
          }
        </div>
      </section>

      <section className="container mx-auto max-w-3xl px-4 pb-14 grid gap-6">
        {queried && <TrackingResults result={result} />}
        {error && (
          <Card className="p-6 text-sm text-red-600">
            {error}
          </Card>
        )}
      </section>
    </div>);

}