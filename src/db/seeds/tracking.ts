import { db } from "@/db";
import { carriers, shipments, shipmentEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

// Seed data matching src/lib/tracking/data.ts
const seedCarriers = [
  { code: "cjlogistics", name: "CJ대한통운" },
  { code: "lotte", name: "롯데택배" },
  { code: "hanjin", name: "한진택배" },
] as const;

const now = Date.now();

export async function seedTracking() {
  // Upsert carriers by code
  for (const c of seedCarriers) {
    const existing = await db.select().from(carriers).where(eq(carriers.code, c.code)).limit(1);
    if (existing.length === 0) {
      await db.insert(carriers).values({ code: c.code, name: c.name });
    }
  }

  // Fetch carrier ids
  const carrierRows = await db.select().from(carriers);
  const carrierIdByCode: Record<string, number> = {};
  for (const cr of carrierRows) carrierIdByCode[cr.code as string] = cr.id as number;

  // Shipments to insert
  const shipmentList = [
    {
      carrierCode: "cjlogistics",
      trackingNumber: "123456789012",
      sender: "서울 강남물류센터",
      recipient: "부산 해운대구 김민수",
      currentStatus: "배송출발",
      estimatedDelivery: new Date(now + 1000 * 60 * 60 * 6).toISOString(),
      history: [
        { time: new Date(now - 1000 * 60 * 60 * 36).toISOString(), location: "서울 성동구", status: "접수", note: "온라인 스토어 접수" },
        { time: new Date(now - 1000 * 60 * 60 * 30).toISOString(), location: "서울 강남집배점", status: "집화" },
        { time: new Date(now - 1000 * 60 * 60 * 24).toISOString(), location: "수원 허브", status: "허브 도착" },
        { time: new Date(now - 1000 * 60 * 60 * 20).toISOString(), location: "수원 허브", status: "허브 출발" },
        { time: new Date(now - 1000 * 60 * 60 * 2).toISOString(), location: "부산 해운대 집배점", status: "이동중" },
        { time: new Date(now - 1000 * 60 * 30).toISOString(), location: "부산 해운대 집배점", status: "배송출발" },
      ],
    },
    {
      carrierCode: "lotte",
      trackingNumber: "876543210987",
      sender: "대전 물류센터",
      recipient: "인천 연수구 박지현",
      currentStatus: "이동중",
      estimatedDelivery: undefined,
      history: [
        { time: new Date(now - 1000 * 60 * 60 * 48).toISOString(), location: "대구", status: "접수" },
        { time: new Date(now - 1000 * 60 * 60 * 42).toISOString(), location: "대전 허브", status: "허브 도착" },
        { time: new Date(now - 1000 * 60 * 60 * 38).toISOString(), location: "대전 허브", status: "허브 출발" },
        { time: new Date(now - 1000 * 60 * 60 * 1).toISOString(), location: "인천 연수구", status: "이동중" },
      ],
    },
    {
      carrierCode: "hanjin",
      trackingNumber: "110022003300",
      sender: "광주 북구",
      recipient: "서울 마포구 최유진",
      currentStatus: "배송완료",
      estimatedDelivery: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      history: [
        { time: new Date(now - 1000 * 60 * 60 * 52).toISOString(), location: "광주 북구", status: "접수" },
        { time: new Date(now - 1000 * 60 * 60 * 46).toISOString(), location: "광주 허브", status: "집화" },
        { time: new Date(now - 1000 * 60 * 60 * 40).toISOString(), location: "천안 허브", status: "허브 도착" },
        { time: new Date(now - 1000 * 60 * 60 * 28).toISOString(), location: "천안 허브", status: "허브 출발" },
        { time: new Date(now - 1000 * 60 * 60 * 8).toISOString(), location: "서울 마포구", status: "배송출발" },
        { time: new Date(now - 1000 * 60 * 60 * 3).toISOString(), location: "서울 마포구", status: "배송완료" },
      ],
    },
  ] as const;

  for (const s of shipmentList) {
    const carrierId = carrierIdByCode[s.carrierCode];
    if (!carrierId) continue;

    // Check existing shipment
    const existing = await db
      .select({ id: shipments.id })
      .from(shipments)
      .where(eq(shipments.trackingNumber, s.trackingNumber))
      .limit(1);

    let shipmentId: number;

    if (existing.length > 0) {
      // Update base fields
      const [updated] = await db
        .update(shipments)
        .set({
          carrierId,
          currentStatus: s.currentStatus,
          estimatedDelivery: s.estimatedDelivery ?? null,
          sender: s.sender ?? null,
          recipient: s.recipient ?? null,
        })
        .where(eq(shipments.id, existing[0].id))
        .returning({ id: shipments.id });
      shipmentId = updated.id;

      // Clear previous events
      await db.delete(shipmentEvents).where(eq(shipmentEvents.shipmentId, shipmentId));
    } else {
      const [created] = await db
        .insert(shipments)
        .values({
          carrierId,
          trackingNumber: s.trackingNumber,
          currentStatus: s.currentStatus,
          estimatedDelivery: s.estimatedDelivery ?? null,
          sender: s.sender ?? null,
          recipient: s.recipient ?? null,
          createdAt: now,
        })
        .returning({ id: shipments.id });
      shipmentId = created.id;
    }

    // Insert events in chronological order
    for (const ev of s.history) {
      await db.insert(shipmentEvents).values({
        shipmentId,
        time: ev.time,
        location: ev.location,
        status: ev.status,
        note: ev.note ?? null,
        createdAt: now,
      });
    }
  }

  return { ok: true } as const;
}

// Note: Export only; call seedTracking() from your scripts when needed.
export default seedTracking;