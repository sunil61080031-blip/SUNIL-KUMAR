import { and, desc, eq, notInArray } from 'drizzle-orm';
import { db } from './index.ts';
import {
  sqlBackups,
  students,
  type SqlWorkspaceBundle,
  workspaces
} from './schema.ts';
import { getOrCreateUser, getUserByUid } from './users.ts';

export async function saveWorkspaceToSql(
  uid: string,
  email: string,
  bundle: SqlWorkspaceBundle,
  deviceLabel = 'Web Admin Console'
) {
  try {
    const user = await getOrCreateUser(uid, email);
    const now = new Date();
    const instituteName = bundle.instituteConfig?.name || 'Coaching Institute';
    const studentList = Array.isArray(bundle.students) ? bundle.students : [];
    const batchList = Array.isArray(bundle.batches) ? bundle.batches : [];

    await db.transaction(async (tx) => {
      await tx
        .insert(workspaces)
        .values({
          userId: user.id,
          instituteName,
          studentCount: studentList.length,
          batchCount: batchList.length,
          deviceLabel,
          instituteConfig: bundle.instituteConfig,
          staffList: bundle.staffList || [],
          batches: batchList,
          feePlans: bundle.feePlans || [],
          notices: bundle.notices || [],
          inquiries: bundle.inquiries || [],
          securityConfig: bundle.securityConfig,
          securityLogs: bundle.securityLogs || [],
          feeReminderSettings: bundle.feeReminderSettings,
          feeReminders: bundle.feeReminders || [],
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: workspaces.userId,
          set: {
            instituteName,
            studentCount: studentList.length,
            batchCount: batchList.length,
            deviceLabel,
            instituteConfig: bundle.instituteConfig,
            staffList: bundle.staffList || [],
            batches: batchList,
            feePlans: bundle.feePlans || [],
            notices: bundle.notices || [],
            inquiries: bundle.inquiries || [],
            securityConfig: bundle.securityConfig,
            securityLogs: bundle.securityLogs || [],
            feeReminderSettings: bundle.feeReminderSettings,
            feeReminders: bundle.feeReminders || [],
            updatedAt: now
          }
        });

      const activeStudentKeys: string[] = [];
      for (const stu of studentList) {
        activeStudentKeys.push(stu.id);
        await tx
          .insert(students)
          .values({
            userId: user.id,
            studentKey: stu.id,
            studentIdCode: stu.studentIdCode || stu.id,
            studentName: stu.studentName || 'Student',
            classNum: Number(stu.classNum || 0),
            batchCode: stu.batchCode || '',
            enrollmentStatus: stu.enrollmentStatus || 'Enrolled',
            netMonthlyFee: Math.round(Number(stu.netMonthlyFee || 0)),
            paidAmount: Math.round(Number(stu.paidAmount || 0)),
            recordData: stu,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [students.userId, students.studentKey],
            set: {
              studentIdCode: stu.studentIdCode || stu.id,
              studentName: stu.studentName || 'Student',
              classNum: Number(stu.classNum || 0),
              batchCode: stu.batchCode || '',
              enrollmentStatus: stu.enrollmentStatus || 'Enrolled',
              netMonthlyFee: Math.round(Number(stu.netMonthlyFee || 0)),
              paidAmount: Math.round(Number(stu.paidAmount || 0)),
              recordData: stu,
              updatedAt: now
            }
          });
      }

      if (activeStudentKeys.length > 0) {
        await tx
          .delete(students)
          .where(
            and(
              eq(students.userId, user.id),
              notInArray(students.studentKey, activeStudentKeys)
            )
          );
      } else {
        await tx.delete(students).where(eq(students.userId, user.id));
      }
    });

    return {
      syncedByEmail: email,
      studentCount: studentList.length,
      batchCount: batchList.length,
      deviceLabel,
      updatedAtIso: now.toISOString(),
      updatedAtMs: now.getTime()
    };
  } catch (error) {
    console.error('Database workspace save failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error
    });
  }
}

export async function loadWorkspaceFromSql(uid: string) {
  try {
    const user = await getUserByUid(uid);
    if (!user) return null;

    const wsRows = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, user.id))
      .limit(1);
    const ws = wsRows[0];
    if (!ws) return null;

    const studentRows = await db
      .select()
      .from(students)
      .where(eq(students.userId, user.id));

    const bundle: SqlWorkspaceBundle = {
      instituteConfig: ws.instituteConfig,
      staffList: ws.staffList,
      batches: ws.batches,
      feePlans: ws.feePlans,
      students: studentRows.map((row) => row.recordData),
      notices: ws.notices,
      inquiries: ws.inquiries,
      securityConfig: ws.securityConfig,
      securityLogs: ws.securityLogs,
      feeReminderSettings: ws.feeReminderSettings,
      feeReminders: ws.feeReminders
    };

    return {
      bundle,
      meta: {
        syncedByEmail: user.email,
        studentCount: bundle.students.length,
        batchCount: bundle.batches.length,
        deviceLabel: ws.deviceLabel,
        updatedAtIso: ws.updatedAt.toISOString(),
        updatedAtMs: ws.updatedAt.getTime()
      }
    };
  } catch (error) {
    console.error('Database workspace load failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error
    });
  }
}

export async function createSqlBackup(
  uid: string,
  email: string,
  backupKey: string,
  label: string,
  bundle: SqlWorkspaceBundle
) {
  try {
    const user = await getOrCreateUser(uid, email);
    const totalCollected = (bundle.students || []).reduce((sum, s) => {
      return sum + (s.paidAmount || 0) + (s.previousYearClearedAmount || 0);
    }, 0);
    const instituteName = bundle.instituteConfig?.name || 'Coaching Institute';

    const inserted = await db
      .insert(sqlBackups)
      .values({
        userId: user.id,
        backupKey,
        label: label.slice(0, 120),
        instituteName: instituteName.slice(0, 160),
        studentCount: bundle.students?.length || 0,
        batchCount: bundle.batches?.length || 0,
        totalCollected: Math.round(totalCollected),
        payload: bundle
      })
      .onConflictDoUpdate({
        target: [sqlBackups.userId, sqlBackups.backupKey],
        set: {
          label: label.slice(0, 120),
          instituteName: instituteName.slice(0, 160),
          studentCount: bundle.students?.length || 0,
          batchCount: bundle.batches?.length || 0,
          totalCollected: Math.round(totalCollected),
          payload: bundle
        }
      })
      .returning();

    const row = inserted[0];
    return {
      backupId: row.backupKey,
      label: row.label,
      createdByEmail: user.email,
      instituteName: row.instituteName,
      studentCount: row.studentCount,
      batchCount: row.batchCount,
      totalCollected: row.totalCollected,
      createdAtIso: row.createdAt.toISOString(),
      createdAtMs: row.createdAt.getTime()
    };
  } catch (error) {
    console.error('Database backup creation failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error
    });
  }
}

export async function listSqlBackups(uid: string) {
  try {
    const user = await getUserByUid(uid);
    if (!user) return [];

    const rows = await db
      .select({
        backupKey: sqlBackups.backupKey,
        label: sqlBackups.label,
        instituteName: sqlBackups.instituteName,
        studentCount: sqlBackups.studentCount,
        batchCount: sqlBackups.batchCount,
        totalCollected: sqlBackups.totalCollected,
        createdAt: sqlBackups.createdAt
      })
      .from(sqlBackups)
      .where(eq(sqlBackups.userId, user.id))
      .orderBy(desc(sqlBackups.createdAt));

    return rows.map((row) => ({
      backupId: row.backupKey,
      label: row.label,
      createdByEmail: user.email,
      instituteName: row.instituteName,
      studentCount: row.studentCount,
      batchCount: row.batchCount,
      totalCollected: row.totalCollected,
      createdAtIso: row.createdAt.toISOString(),
      createdAtMs: row.createdAt.getTime()
    }));
  } catch (error) {
    console.error('Database backups list failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error
    });
  }
}

export async function getSqlBackupPayload(uid: string, backupKey: string) {
  try {
    const user = await getUserByUid(uid);
    if (!user) return null;

    const rows = await db
      .select()
      .from(sqlBackups)
      .where(
        and(eq(sqlBackups.userId, user.id), eq(sqlBackups.backupKey, backupKey))
      )
      .limit(1);

    return rows[0]?.payload || null;
  } catch (error) {
    console.error('Database backup fetch failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error
    });
  }
}

export async function deleteSqlBackup(uid: string, backupKey: string) {
  try {
    const user = await getUserByUid(uid);
    if (!user) return;

    await db
      .delete(sqlBackups)
      .where(
        and(eq(sqlBackups.userId, user.id), eq(sqlBackups.backupKey, backupKey))
      );
  } catch (error) {
    console.error('Database backup deletion failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error
    });
  }
}
