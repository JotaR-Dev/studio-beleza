import { pgTable, uuid, text, boolean, timestamp, integer, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  whatsappOptIn: boolean('whatsapp_opt_in').default(true),
  role: text('role').default('CLIENT'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  price: doublePrecision('price').notNull(),
  active: boolean('active').default(true),
});

export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  status: text('status').default('CONFIRMED'), // CONFIRMED, CANCELED, COMPLETED
  reminderSentAt: timestamp('reminder_sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id').references(() => appointments.id).notNull(),
  recipientType: text('recipient_type').notNull(), // CLIENT, OWNER
  type: text('type').notNull(), // REMINDER, NEW, RESCHEDULED, CANCELED
  status: text('status').default('PENDING'), // PENDING, SENT, FAILED
  providerMessageId: text('provider_message_id'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
});

import { relations } from 'drizzle-orm';

// ... (mantenha todo o código existente das tabelas)

// Adicione isto no final do arquivo:
export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));