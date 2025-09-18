import { db } from '@/db';
import { carriers, shipments, shipmentEvents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  const results = {
    carriers: { inserted: 0, skipped: 0 },
    shipments: { inserted: 0, skipped: 0 },
    shipmentEvents: { inserted: 0, skipped: 0 }
  };

  // Seed carriers with upsert logic
  const carrierData = [
    { code: 'cjlogistics', name: 'CJ대한통운' },
    { code: 'lotte', name: '롯데택배' },
    { code: 'hanjin', name: '한진택배' }
  ];

  for (const carrier of carrierData) {
    const existingCarrier = await db.select().from(carriers).where(eq(carriers.code, carrier.code)).limit(1);
    if (existingCarrier.length === 0) {
      await db.insert(carriers).values(carrier);
      results.carriers.inserted++;
    } else {
      results.carriers.skipped++;
    }
  }

  // Get carrier IDs for reference
  const carrierRecords = await db.select().from(carriers);
  const carrierMap = new Map(carrierRecords.map(c => [c.code, c.id]));

  // Seed shipments
  const shipmentData = [
    {
      carrierId: carrierMap.get('cjlogistics')!,
      trackingNumber: '123456789012',
      currentStatus: '배송출발',
      estimatedDelivery: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00'),
      sender: '서울 강남물류센터',
      recipient: '부산 해운대구 김민수',
      createdAt: Date.now()
    },
    {
      carrierId: carrierMap.get('lotte')!,
      trackingNumber: '876543210987',
      currentStatus: '이동중',
      estimatedDelivery: null,
      sender: '대전 물류센터',
      recipient: '인천 연수구 박지현',
      createdAt: Date.now()
    },
    {
      carrierId: carrierMap.get('hanjin')!,
      trackingNumber: '110022003300',
      currentStatus: '배송완료',
      estimatedDelivery: '2025-09-15T17:30:00+09:00',
      sender: '광주 북구',
      recipient: '서울 마포구 최유진',
      createdAt: Date.now()
    }
  ];

  const shipmentIds = new Map<string, number>();
  for (const shipment of shipmentData) {
    const existingShipment = await db.select({ id: shipments.id }).from(shipments)
      .where(eq(shipments.trackingNumber, shipment.trackingNumber)).limit(1);
    
    if (existingShipment.length === 0) {
      const result = await db.insert(shipments).values(shipment);
      shipmentIds.set(shipment.trackingNumber, result.lastInsertRowid as number);
      results.shipments.inserted++;
    } else {
      shipmentIds.set(shipment.trackingNumber, existingShipment[0].id);
      results.shipments.skipped++;
    }
  }

  // Seed shipment events
  const eventsData = [
    // CJ Events
    { trackingNumber: '123456789012', time: '2025-09-15T09:00:00+09:00', location: '서울 성동구', status: '접수' },
    { trackingNumber: '123456789012', time: '2025-09-15T14:30:00+09:00', location: '강남 집배점', status: '집화' },
    { trackingNumber: '123456789012', time: '2025-09-16T08:10:00+09:00', location: '수원 HUB', status: '허브 도착' },
    { trackingNumber: '123456789012', time: '2025-09-16T10:40:00+09:00', location: '수원 HUB', status: '허브 출발' },
    { trackingNumber: '123456789012', time: '2025-09-17T07:20:00+09:00', location: '부산 해운대 집배점', status: '이동중' },
    { trackingNumber: '123456789012', time: '2025-09-17T09:00:00+09:00', location: '부산 해운대 집배점', status: '배송출발' },
    // Lotte Events
    { trackingNumber: '876543210987', time: '2025-09-14T10:00:00+09:00', location: '대구', status: '접수' },
    { trackingNumber: '876543210987', time: '2025-09-14T16:10:00+09:00', location: '대전 허브', status: '허브 도착' },
    { trackingNumber: '876543210987', time: '2025-09-14T18:00:00+09:00', location: '대전 허브', status: '허브 출발' },
    { trackingNumber: '876543210987', time: '2025-09-15T11:25:00+09:00', location: '인천 연수구', status: '이동중' },
    // Hanjin Events
    { trackingNumber: '110022003300', time: '2025-09-13T09:20:00+09:00', location: '광주 북구', status: '접수' },
    { trackingNumber: '110022003300', time: '2025-09-13T12:45:00+09:00', location: '광주 허브', status: '집화' },
    { trackingNumber: '110022003300', time: '2025-09-14T07:50:00+09:00', location: '천안 허브', status: '허브 도착' },
    { trackingNumber: '110022003300', time: '2025-09-14T10:15:00+09:00', location: '천안 허브', status: '허브 출발' },
    { trackingNumber: '110022003300', time: '2025-09-15T09:10:00+09:00', location: '서울 마포구', status: '배송출발' },
    { trackingNumber: '110022003300', time: '2025-09-15T17:30:00+09:00', location: '서울 마포구', status: '배송완료' }
  ];

  for (const event of eventsData) {
    const shipmentId = shipmentIds.get(event.trackingNumber);
    if (!shipmentId) continue;

    const existingEvent = await db.select().from(shipmentEvents)
      .where(
        and(
          eq(shipmentEvents.shipmentId, shipmentId),
          eq(shipmentEvents.time, event.time),
          eq(shipmentEvents.location, event.location),
          eq(shipmentEvents.status, event.status)
        )
      ).limit(1);

    if (existingEvent.length === 0) {
      await db.insert(shipmentEvents).values({
        shipmentId,
        time: event.time,
        location: event.location,
        status: event.status,
        createdAt: Date.now()
      });
      results.shipmentEvents.inserted++;
    } else {
      results.shipmentEvents.skipped++;
    }
  }

  // Verification queries
  const carrierCount = await db.select({ count: carriers.id }).from(carriers);
  const shipmentCount = await db.select({ count: shipments.id }).from(shipments);
  const eventCount = await db.select({ count: shipmentEvents.id }).from(shipmentEvents);

  console.log('\n✅ Tracking system seeder completed successfully');
  console.log('\nSeeding Results:');
  console.log(`  Carriers: ${results.carriers.inserted} inserted, ${results.carriers.skipped} skipped`);
  console.log(`  Shipments: ${results.shipments.inserted} inserted, ${results.shipments.skipped} skipped`);
  console.log(`  Shipment Events: ${results.shipmentEvents.inserted} inserted, ${results.shipmentEvents.skipped} skipped`);
  console.log('\nTable Counts:');
  console.log(`  Carriers: ${carrierCount.length} total`);
  console.log(`  Shipments: ${shipmentCount.length} total`);
  console.log(`  Shipment Events: ${eventCount.length} total`);
  console.log('\nSample Data:');
  const sampleShipments = await db.select({
    trackingNumber: shipments.trackingNumber,
    carrier: carriers.name,
    recipient: shipments.recipient,
    status: shipments.currentStatus
  }).from(shipments).leftJoin(carriers, eq(shipments.carrierId, carriers.id)).limit(3);
  
  sampleShipments.forEach(s => {
    console.log(`  - ${s.trackingNumber} (${s.carrier}): ${s.recipient} - ${s.status}`);
  });
}

main().catch((error) => {
  console.error('❌ Seeder failed:', error);
});