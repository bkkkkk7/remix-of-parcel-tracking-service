import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const carriers = sqliteTable('carriers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
});

export const shipments = sqliteTable('shipments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  carrierId: integer('carrier_id').references(() => carriers.id).notNull(),
  trackingNumber: text('tracking_number').notNull().unique(),
  currentStatus: text('current_status').notNull(),
  estimatedDelivery: text('estimated_delivery'),
  sender: text('sender'),
  recipient: text('recipient'),
  createdAt: integer('created_at').notNull(),
});

export const shipmentEvents = sqliteTable('shipment_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  shipmentId: integer('shipment_id').references(() => shipments.id).notNull(),
  time: text('time').notNull(),
  location: text('location').notNull(),
  status: text('status').notNull(),
  note: text('note'),
  createdAt: integer('created_at').notNull(),
});