"use client"

import React, { useState } from "react";
import TrackingSearch from "@/components/tracking/TrackingSearch";
import TrackingResults from "@/components/tracking/TrackingResults";
import { Card } from "@/components/ui/card";
import { searchMockTracking, CarrierCode, TrackingResult } from "@/lib/tracking/data";

export default function TrackingPage() {
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [queried, setQueried] = useState(false);

  function handleSearch({ carrier, trackingNumber }: { carrier: CarrierCode; trackingNumber: string }) {
    const r = searchMockTracking(carrier, trackingNumber);
    setResult(r);
    setQueried(true);
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold">택배 조회</h1>
        <p className="text-muted-foreground text-sm">CJ대한통운 · 롯데택배 · 한진택배 운송장 번호로 현재 상태를 확인하세요.</p>
      </div>
      <Card className="p-4">
        <TrackingSearch onSearch={handleSearch} />
      </Card>
      {queried ? (
        <TrackingResults result={result} />
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">
          운송장 번호와 택배사를 선택해 조회해 보세요. 예) CJ대한통운 123456789012, 롯데 876543210987, 한진 110022003300
        </Card>
      )}
    </div>
  );
}