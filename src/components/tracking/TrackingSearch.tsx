"use client"

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARRIERS, CarrierCode } from "@/lib/tracking/data";

export type TrackingSearchValues = {
  carrier: CarrierCode | "";
  trackingNumber: string;
};

export default function TrackingSearch({
  onSearch,
  defaultCarrier = "cjlogistics",
  placeholder = "운송장 번호를 입력하세요",
}: {
  onSearch: (values: { carrier: CarrierCode; trackingNumber: string }) => void;
  defaultCarrier?: CarrierCode;
  placeholder?: string;
}) {
  const [carrier, setCarrier] = useState<CarrierCode | "">(defaultCarrier);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!carrier || !trackingNumber.trim()) return;
    setLoading(true);
    Promise.resolve().then(() => {
      onSearch({ carrier, trackingNumber: trackingNumber.trim() });
      setLoading(false);
    });
  }

  return (
    <form onSubmit={submit} className="w-full flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={carrier || undefined} onValueChange={(v) => setCarrier(v as CarrierCode)}>
        <SelectTrigger className="sm:w-44 w-full" aria-label="택배사 선택">
          <SelectValue placeholder="택배사" />
        </SelectTrigger>
        <SelectContent>
          {CARRIERS.map((c) => (
            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
        className="flex-1"
        aria-label="운송장 번호"
      />

      <Button type="submit" disabled={!carrier || !trackingNumber.trim() || loading} className="sm:w-28 w-full">
        {loading ? "조회중..." : "조회"}
      </Button>
    </form>
  );
}