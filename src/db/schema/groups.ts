import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  archivedAt: timestamp("archived_at"),
});

export const groupMembers = pgTable("group_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  defaultShare: integer("default_share").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
