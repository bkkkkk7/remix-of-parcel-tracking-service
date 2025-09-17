import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carriers, shipments, shipmentEvents } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

interface TrackingResult {
  carrier: "cjlogistics" | "lotte" | "hanjin";
  carrierName: string;
  trackingNumber: string;
  currentStatus: "접수" | "집화" | "이동중" | "허브 도착" | "허브 출발" | "배송출발" | "배송완료" | "보류";
  estimatedDelivery?: string;
  history: Array<{ time: string; location: string; status: string; note?: string }>;
  sender?: string;
  recipient?: string;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const carrierCode = url.searchParams.get('carrier');
    const trackingNumber = url.searchParams.get('trackingNumber');

    console.log('Debug - Full URL:', request.url);
    console.log('Debug - Parsed URL searchParams:', Object.fromEntries(url.searchParams.entries()));
    console.log('Debug - carrierCode:', carrierCode);
    console.log('Debug - trackingNumber:', trackingNumber);

    if (!carrierCode || carrierCode.trim() === '') {
      return NextResponse.json({ message: "Carrier code is required" }, { status: 400 });
    }

    if (!trackingNumber || trackingNumber.trim() === '') {
      return NextResponse.json({ message: "Tracking number is required" }, { status: 400 });
    }

    // Validate carrier exists
    const [carrier] = await db.select().from(carriers).where(eq(carriers.code, carrierCode)).limit(1);
    
    if (!carrier) {
      return NextResponse.json({ message: "Carrier not found" }, { status: 404 });
    }

    // Get shipment information
    const [shipment] = await db
      .select({
        id: shipments.id,
        trackingNumber: shipments.trackingNumber,
        currentStatus: shipments.currentStatus,
        estimatedDelivery: shipments.estimatedDelivery,
        sender: shipments.sender,
        recipient: shipments.recipient,
        carrierId: shipments.carrierId,
        carrierCode: carriers.code,
        carrierName: carriers.name,
      })
      .from(shipments)
      .innerJoin(carriers, eq(shipments.carrierId, carriers.id))
      .where(and(
        eq(shipments.trackingNumber, trackingNumber),
        eq(carriers.code, carrierCode)
      ))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    // Get shipment events ordered by time ascending
    const events = await db
      .select({
        time: shipmentEvents.time,
        location: shipmentEvents.location,
        status: shipmentEvents.status,
        note: shipmentEvents.note,
      })
      .from(shipmentEvents)
      .where(eq(shipmentEvents.shipmentId, shipment.id))
      .orderBy(asc(shipmentEvents.time));

    const result: TrackingResult = {
      carrier: shipment.carrierCode as "cjlogistics" | "lotte" | "hanjin",
      carrierName: shipment.carrierName,
      trackingNumber: shipment.trackingNumber,
      currentStatus: shipment.currentStatus as "접수" | "집화" | "이동중" | "허브 도착" | "허브 출발" | "배송출발" | "배송완료" | "보류",
      estimatedDelivery: shipment.estimatedDelivery || undefined,
      history: events.map(event => ({
        time: event.time,
        location: event.location,
        status: event.status,
        note: event.note || undefined,
      })),
      sender: shipment.sender || undefined,
      recipient: shipment.recipient || undefined,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GET /api/tracking error:', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const {
      carrier: carrierCode,
      trackingNumber,
      sender,
      recipient,
      estimatedDelivery,
      history
    } = requestData;

    // Validate required fields
    if (!carrierCode) {
      return NextResponse.json({ message: "Carrier is required" }, { status: 400 });
    }

    if (!trackingNumber) {
      return NextResponse.json({ message: "Tracking number is required" }, { status: 400 });
    }

    // Create or update carrier (upsert by code)
    let carrier = await db
      .select()
      .from(carriers)
      .where(eq(carriers.code, carrierCode))
      .limit(1)
      .then(results => results[0]);

    if (!carrier) {
      // Create new carrier with default name
      const carrierNames = {
        "cjlogistics": "CJ대한통운",
        "lotte": "롯데택배",
        "hanjin": "한진택배"
      };
      
      [carrier] = await db
        .insert(carriers)
        .values({
          code: carrierCode,
          name: carrierNames[carrierCode as keyof typeof carrierNames] || carrierCode,
        })
        .returning();
    }

    // Determine current status from last history item
    const currentStatus = history && history.length > 0 
      ? history[history.length - 1].status 
      : "접수";

    // Check for existing shipment
    const existingShipment = await db
      .select()
      .from(shipments)
      .where(and(
        eq(shipments.trackingNumber, trackingNumber),
        eq(shipments.carrierId, carrier.id)
      ))
      .limit(1)
      .then(results => results[0]);

    let savedShipment;
    let shipmentId;
    
    if (existingShipment) {
      // Update existing record
      [savedShipment] = await db
        .update(shipments)
        .set({
          currentStatus,
          estimatedDelivery: estimatedDelivery || null,
          sender: sender || null,
          recipient: recipient || null,
        })
        .where(eq(shipments.id, existingShipment.id))
        .returning();
      shipmentId = existingShipment.id;
    } else {
      // Create new record
      [savedShipment] = await db
        .insert(shipments)
        .values({
          trackingNumber,
          carrierId: carrier.id,
          currentStatus,
          estimatedDelivery: estimatedDelivery || null,
          sender: sender || null,
          recipient: recipient || null,
          createdAt: Date.now(),
        })
        .returning();
      shipmentId = savedShipment.id;
    }

    // If history provided, replace all existing shipment_events
    if (history && history.length > 0) {
      // Delete existing shipment events for this shipment
      await db.delete(shipmentEvents)
        .where(eq(shipmentEvents.shipmentId, shipmentId));

      // Insert new shipment events
      const eventData = history.map((event: any) => ({
        shipmentId,
        time: event.time,
        location: event.location,
        status: event.status,
        note: event.note || null,
        createdAt: Date.now(),
      }));

      await db.insert(shipmentEvents).values(eventData);
    }

    // Get current events for response
    const events = await db
      .select({
        time: shipmentEvents.time,
        location: shipmentEvents.location,
        status: shipmentEvents.status,
        note: shipmentEvents.note,
      })
      .from(shipmentEvents)
      .where(eq(shipmentEvents.shipmentId, shipmentId))
      .orderBy(asc(shipmentEvents.time));

    const result: TrackingResult = {
      carrier: carrier.code as "cjlogistics" | "lotte" | "hanjin",
      carrierName: carrier.name,
      trackingNumber,
      currentStatus: savedShipment.currentStatus as "접수" | "집화" | "이동중" | "허브 도착" | "허브 출발" | "배송출발" | "배송완료" | "보류",
      estimatedDelivery: savedShipment.estimatedDelivery || undefined,
      history: events.map(event => ({
        time: event.time,
        location: event.location,
        status: event.status,
        note: event.note || undefined,
      })),
      sender: savedShipment.sender || undefined,
      recipient: savedShipment.recipient || undefined,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/tracking error:', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}