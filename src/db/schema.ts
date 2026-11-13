import { relations } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import type {
  BatchItem,
  FeePlan,
  FeeReminderLogItem,
  FeeReminderSettings,
  InquiryItem,
  InstituteConfig,
  NoticeItem,
  SecurityConfig,
  SecurityLogItem,
  StaffMember,
  StudentRecord
} from '../types/index.ts';

export interface SqlWorkspaceBundle {
  instituteConfig: InstituteConfig;
  staffList: StaffMember[];
  batches: BatchItem[];
  feePlans: FeePlan[];
  students: StudentRecord[];
  notices: NoticeItem[];
  inquiries: InquiryItem[];
  securityConfig: SecurityConfig;
  securityLogs: SecurityLogItem[];
  feeReminderSettings: FeeReminderSettings;
  feeReminders: FeeReminderLogItem[];
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const workspaces = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  instituteName: text('institute_name').notNull(),
  studentCount: integer('student_count').notNull().default(0),
  batchCount: integer('batch_count').notNull().default(0),
  deviceLabel: text('device_label').notNull().default('Web Admin Console'),
  instituteConfig: jsonb('institute_config').$type<InstituteConfig>().notNull(),
  staffList: jsonb('staff_list').$type<StaffMember[]>().notNull(),
  batches: jsonb('batches').$type<BatchItem[]>().notNull(),
  feePlans: jsonb('fee_plans').$type<FeePlan[]>().notNull(),
  notices: jsonb('notices').$type<NoticeItem[]>().notNull(),
  inquiries: jsonb('inquiries').$type<InquiryItem[]>().notNull(),
  securityConfig: jsonb('security_config').$type<SecurityConfig>().notNull(),
  securityLogs: jsonb('security_logs').$type<SecurityLogItem[]>().notNull(),
  feeReminderSettings: jsonb('fee_reminder_settings')
    .$type<FeeReminderSettings>()
    .notNull(),
  feeReminders: jsonb('fee_reminders').$type<FeeReminderLogItem[]>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const students = pgTable(
  'students',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    studentKey: text('student_key').notNull(),
    studentIdCode: text('student_id_code').notNull(),
    studentName: text('student_name').notNull(),
    classNum: integer('class_num').notNull(),
    batchCode: text('batch_code').notNull(),
    enrollmentStatus: text('enrollment_status').notNull(),
    netMonthlyFee: integer('net_monthly_fee').notNull().default(0),
    paidAmount: integer('paid_amount').notNull().default(0),
    recordData: jsonb('record_data').$type<StudentRecord>().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('students_user_key_idx').on(table.userId, table.studentKey)
  ]
);

export const sqlBackups = pgTable(
  'sql_backups',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    backupKey: text('backup_key').notNull(),
    label: text('label').notNull(),
    instituteName: text('institute_name').notNull(),
    studentCount: integer('student_count').notNull().default(0),
    batchCount: integer('batch_count').notNull().default(0),
    totalCollected: integer('total_collected').notNull().default(0),
    payload: jsonb('payload').$type<SqlWorkspaceBundle>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('sql_backups_user_key_idx').on(table.userId, table.backupKey)
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [users.id],
    references: [workspaces.userId]
  }),
  students: many(students),
  backups: many(sqlBackups)
}));

export const workspacesRelations = relations(workspaces, ({ one }) => ({
  owner: one(users, {
    fields: [workspaces.userId],
    references: [users.id]
  })
}));

export const studentsRelations = relations(students, ({ one }) => ({
  owner: one(users, {
    fields: [students.userId],
    references: [users.id]
  })
}));

export const sqlBackupsRelations = relations(sqlBackups, ({ one }) => ({
  owner: one(users, {
    fields: [sqlBackups.userId],
    references: [users.id]
  })
}));
