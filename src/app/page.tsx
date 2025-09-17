"use client";

import React, { useState } from "react";
import TrackingSearch from "@/components/tracking/TrackingSearch";
import TrackingResults from "@/components/tracking/TrackingResults";
import { Card } from "@/components/ui/card";
import { searchMockTracking, type CarrierCode, type TrackingResult } from "@/lib/tracking/data";

export default function Home() {
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [queried, setQueried] = useState(false);

  function handleSearch({ carrier, trackingNumber }: {carrier: CarrierCode;trackingNumber: string;}) {
    const r = searchMockTracking(carrier, trackingNumber);
    setResult(r);
    setQueried(true);
  }

  return (
    <div className="min-h-screen">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-center bg-cover opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=2070&auto=format&fit=crop')" }} />
        <div className="container mx-auto max-w-3xl px-4 pt-14 pb-8 sm:pt-20 sm:pb-10 grid gap-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">택배 조회 서비스</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            국내 주요 택배사(CJ대한통운 · 롯데택배 · 한진택배)의 운송장 번호로 현재 위치와 배송 상태를 확인하세요.
          </p>
          <Card className="p-4 !text-lg">
            <TrackingSearch onSearch={handleSearch} />
          </Card>
          {!queried &&
          <Card className="p-6 text-sm text-muted-foreground">
              예시: CJ대한통운 123456789012 · 롯데 876543210987 · 한진 110022003300
            </Card>
          }
        </div>
      </section>

      <section className="container mx-auto max-w-3xl px-4 pb-14 grid gap-6">
        {queried && <TrackingResults result={result} />}
      </section>
    </div>);

}