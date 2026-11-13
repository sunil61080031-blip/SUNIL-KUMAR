import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
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
} from '../types';

export const BACKUP_SCHEMA_VERSION = 1;
export const BACKUP_FORMAT_TAG = 'SNTC_APP_BACKUP_V1';

export interface AppDataBundle {
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

export interface BackupSummaryMeta {
  instituteName: string;
  studentCount: number;
  batchCount: number;
  staffCount: number;
  noticeCount: number;
  totalFeeCollected: number;
}

export interface BackupFileEnvelope {
  format: string;
  schemaVersion: number;
  exportedAt: string;
  exportedBy: string;
  checksumSha256: string;
  summary: BackupSummaryMeta;
  data: AppDataBundle;
}

export interface RestoreScopeSelection {
  instituteAndCentres: boolean;
  studentsAndLedgers: boolean;
  batchesAndFees: boolean;
  staffAndNotices: boolean;
  securityAndReminders: boolean;
}

export interface CloudWorkspaceMeta {
  syncedByEmail: string;
  studentCount: number;
  batchCount: number;
  deviceLabel: string;
  updatedAtIso: string;
  updatedAtMs: number;
}

export interface CloudBackupEntry {
  backupId: string;
  label: string;
  createdByEmail: string;
  instituteName: string;
  studentCount: number;
  batchCount: number;
  totalCollected: number;
  createdAtIso: string;
  createdAtMs: number;
}

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

export function computeBundleSummary(bundle: AppDataBundle): BackupSummaryMeta {
  const totalFeeCollected = bundle.students.reduce((sum, s) => {
    return sum + (s.paidAmount || 0) + (s.previousYearClearedAmount || 0);
  }, 0);
  return {
    instituteName: bundle.instituteConfig?.name || 'Coaching Institute',
    studentCount: bundle.students.length,
    batchCount: bundle.batches.length,
    staffCount: bundle.staffList.length,
    noticeCount: bundle.notices.length,
    totalFeeCollected
  };
}

export async function computePayloadSha256(data: AppDataBundle): Promise<string> {
  const json = JSON.stringify(data);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(json);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 2166136261;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}

export async function buildLocalBackupEnvelope(
  bundle: AppDataBundle,
  exportedBy: string
): Promise<BackupFileEnvelope> {
  const cleanBundle = stripUndefinedDeep(bundle);
  const checksumSha256 = await computePayloadSha256(cleanBundle);
  return {
    format: BACKUP_FORMAT_TAG,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy,
    checksumSha256,
    summary: computeBundleSummary(cleanBundle),
    data: cleanBundle
  };
}

export async function parseAndValidateBackupJson(rawText: string): Promise<{
  valid: boolean;
  error?: string;
  checksumVerified: boolean;
  envelope?: BackupFileEnvelope;
}> {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, checksumVerified: false, error: 'Invalid JSON object.' };
    }

    const candidateData: Partial<AppDataBundle> =
      parsed.format === BACKUP_FORMAT_TAG && parsed.data
        ? parsed.data
        : parsed;

    if (
      !candidateData.instituteConfig ||
      !Array.isArray(candidateData.students) ||
      !Array.isArray(candidateData.batches)
    ) {
      return {
        valid: false,
        checksumVerified: false,
        error:
          'File is missing required instituteConfig, students, or batches sections.'
      };
    }

    const normalizedBundle: AppDataBundle = {
      instituteConfig: candidateData.instituteConfig,
      staffList: Array.isArray(candidateData.staffList) ? candidateData.staffList : [],
      batches: candidateData.batches,
      feePlans: Array.isArray(candidateData.feePlans) ? candidateData.feePlans : [],
      students: candidateData.students,
      notices: Array.isArray(candidateData.notices) ? candidateData.notices : [],
      inquiries: Array.isArray(candidateData.inquiries) ? candidateData.inquiries : [],
      securityConfig: candidateData.securityConfig as SecurityConfig,
      securityLogs: Array.isArray(candidateData.securityLogs)
        ? candidateData.securityLogs
        : [],
      feeReminderSettings:
        candidateData.feeReminderSettings as FeeReminderSettings,
      feeReminders: Array.isArray(candidateData.feeReminders)
        ? candidateData.feeReminders
        : []
    };

    let checksumVerified = false;
    if (typeof parsed.checksumSha256 === 'string' && parsed.data) {
      const actualHash = await computePayloadSha256(
        stripUndefinedDeep(parsed.data as AppDataBundle)
      );
      checksumVerified = actualHash === parsed.checksumSha256;
    }

    return {
      valid: true,
      checksumVerified,
      envelope: {
        format: parsed.format || BACKUP_FORMAT_TAG,
        schemaVersion: Number(parsed.schemaVersion) || BACKUP_SCHEMA_VERSION,
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        exportedBy: parsed.exportedBy || 'Local Backup File',
        checksumSha256: parsed.checksumSha256 || '',
        summary: computeBundleSummary(normalizedBundle),
        data: normalizedBundle
      }
    };
  } catch (err) {
    return {
      valid: false,
      checksumVerified: false,
      error:
        err instanceof Error
          ? `Could not parse backup file: ${err.message}`
          : 'Invalid backup JSON file.'
    };
  }
}

function sanitizeDocId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return (cleaned || `id_${Date.now()}`).slice(0, 120);
}

function formatTimestamp(ts: unknown): { iso: string; ms: number } {
  if (ts instanceof Timestamp) {
    return { iso: ts.toDate().toISOString(), ms: ts.toMillis() };
  }
  if (ts && typeof ts === 'object' && 'toDate' in ts) {
    const d = (ts as { toDate: () => Date }).toDate();
    return { iso: d.toISOString(), ms: d.getTime() };
  }
  return { iso: new Date().toISOString(), ms: Date.now() };
}

async function getSqlAuthHeaders(): Promise<Record<string, string> | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken();
    if (!token) return null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  } catch {
    return null;
  }
}

async function sqlRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T | null> {
  const headers = await getSqlAuthHeaders();
  if (!headers) return null;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errBody = (await response.json()) as { error?: string };
      if (errBody?.error) message = errBody.error;
    } catch {
      // ignore non-JSON error body
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function fetchFirestoreWorkspaceMeta(
  uid: string
): Promise<CloudWorkspaceMeta | null> {
  const path = `users/${uid}/workspaces/main`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'workspaces', 'main'));
    if (!snap.exists()) return null;
    const d = snap.data();
    const t = formatTimestamp(d.updatedAt);
    return {
      syncedByEmail: String(d.syncedByEmail || ''),
      studentCount: Number(d.studentCount || 0),
      batchCount: Number(d.batchCount || 0),
      deviceLabel: String(d.deviceLabel || 'Web Browser'),
      updatedAtIso: t.iso,
      updatedAtMs: t.ms
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function fetchCloudWorkspaceMeta(
  uid: string
): Promise<CloudWorkspaceMeta | null> {
  const [sqlResult, fsResult] = await Promise.allSettled([
    sqlRequest<{ bundle: AppDataBundle | null; meta: CloudWorkspaceMeta | null }>(
      '/api/workspace',
      { method: 'GET' }
    ),
    fetchFirestoreWorkspaceMeta(uid)
  ]);

  const sqlMeta =
    sqlResult.status === 'fulfilled' ? sqlResult.value?.meta || null : null;
  const fsMeta = fsResult.status === 'fulfilled' ? fsResult.value : null;

  if (sqlMeta && fsMeta) {
    return sqlMeta.updatedAtMs >= fsMeta.updatedAtMs ? sqlMeta : fsMeta;
  }
  if (sqlMeta) return sqlMeta;
  if (fsMeta) return fsMeta;

  if (fsResult.status === 'rejected' && sqlResult.status === 'rejected') {
    throw fsResult.reason;
  }
  return null;
}

async function pushWorkspaceToFirestore(
  uid: string,
  userEmail: string,
  clean: AppDataBundle,
  deviceLabel: string
): Promise<CloudWorkspaceMeta> {
  const workspacePath = `users/${uid}/workspaces/main`;
  const studentsCollPath = `users/${uid}/students`;

  let existingCreatedAt: unknown = null;
  try {
    const existingSnap = await getDoc(doc(db, 'users', uid, 'workspaces', 'main'));
    if (existingSnap.exists()) {
      existingCreatedAt = existingSnap.data().createdAt;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, workspacePath);
  }

  try {
    await setDoc(doc(db, 'users', uid, 'workspaces', 'main'), {
      ownerUid: uid,
      syncedByEmail: (userEmail || 'admin').slice(0, 160),
      schemaVersion: BACKUP_SCHEMA_VERSION,
      studentCount: clean.students.length,
      batchCount: clean.batches.length,
      deviceLabel: deviceLabel.slice(0, 120),
      instituteConfig: clean.instituteConfig,
      staffList: clean.staffList.slice(0, 300),
      batches: clean.batches.slice(0, 300),
      feePlans: clean.feePlans.slice(0, 100),
      notices: clean.notices.slice(0, 500),
      inquiries: clean.inquiries.slice(0, 500),
      securityConfig: clean.securityConfig,
      securityLogs: clean.securityLogs.slice(0, 200),
      feeReminderSettings: clean.feeReminderSettings,
      feeReminders: clean.feeReminders.slice(0, 500),
      createdAt: existingCreatedAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, workspacePath);
  }

  const existingStudentsMap = new Map<string, unknown>();
  try {
    const existingSnaps = await getDocs(
      query(collection(db, 'users', uid, 'students'), where('ownerUid', '==', uid))
    );
    existingSnaps.forEach((sDoc) => {
      existingStudentsMap.set(sDoc.id, sDoc.data().createdAt);
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, studentsCollPath);
  }

  const incomingIds = new Set<string>();
  const ops: Array<{
    type: 'set' | 'delete';
    studentId: string;
    data?: Record<string, unknown>;
  }> = [];

  for (const stu of clean.students) {
    const docId = sanitizeDocId(stu.id);
    incomingIds.add(docId);
    const prevCreated = existingStudentsMap.get(docId);
    ops.push({
      type: 'set',
      studentId: docId,
      data: {
        ownerUid: uid,
        studentId: docId,
        studentIdCode: (stu.studentIdCode || docId).slice(0, 64),
        studentName: (stu.studentName || 'Student').slice(0, 120),
        record: stu,
        createdAt: prevCreated || serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    });
  }

  for (const oldId of existingStudentsMap.keys()) {
    if (!incomingIds.has(oldId)) {
      ops.push({ type: 'delete', studentId: oldId });
    }
  }

  try {
    for (let i = 0; i < ops.length; i += 400) {
      const chunk = ops.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const op of chunk) {
        const ref = doc(db, 'users', uid, 'students', op.studentId);
        if (op.type === 'set' && op.data) {
          batch.set(ref, op.data);
        } else {
          batch.delete(ref);
        }
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, studentsCollPath);
  }

  return {
    syncedByEmail: userEmail,
    studentCount: clean.students.length,
    batchCount: clean.batches.length,
    deviceLabel,
    updatedAtIso: new Date().toISOString(),
    updatedAtMs: Date.now()
  };
}

export async function pushWorkspaceToCloud(
  uid: string,
  userEmail: string,
  bundle: AppDataBundle,
  deviceLabel = 'Web Admin Console'
): Promise<CloudWorkspaceMeta> {
  const clean = stripUndefinedDeep(bundle);

  const [sqlResult, fsResult] = await Promise.allSettled([
    sqlRequest<{ meta: CloudWorkspaceMeta }>('/api/workspace', {
      method: 'PUT',
      body: JSON.stringify({ bundle: clean, deviceLabel })
    }),
    pushWorkspaceToFirestore(uid, userEmail, clean, deviceLabel)
  ]);

  if (sqlResult.status === 'fulfilled' && sqlResult.value?.meta) {
    return sqlResult.value.meta;
  }
  if (fsResult.status === 'fulfilled') {
    return fsResult.value;
  }
  if (sqlResult.status === 'rejected') {
    throw sqlResult.reason;
  }
  throw new Error('Failed to sync workspace to cloud.');
}

async function pullWorkspaceFromFirestore(
  uid: string
): Promise<{ bundle: AppDataBundle; meta: CloudWorkspaceMeta } | null> {
  const workspacePath = `users/${uid}/workspaces/main`;
  const studentsPath = `users/${uid}/students`;

  let wsData: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'workspaces', 'main'));
    if (!snap.exists()) return null;
    wsData = snap.data() as Record<string, unknown>;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, workspacePath);
  }

  const students: StudentRecord[] = [];
  try {
    const studentSnaps = await getDocs(
      query(collection(db, 'users', uid, 'students'), where('ownerUid', '==', uid))
    );
    studentSnaps.forEach((sDoc) => {
      const data = sDoc.data();
      if (data?.record) {
        students.push(data.record as StudentRecord);
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, studentsPath);
  }

  const t = formatTimestamp(wsData.updatedAt);
  const bundle: AppDataBundle = {
    instituteConfig: wsData.instituteConfig as InstituteConfig,
    staffList: (wsData.staffList as StaffMember[]) || [],
    batches: (wsData.batches as BatchItem[]) || [],
    feePlans: (wsData.feePlans as FeePlan[]) || [],
    students,
    notices: (wsData.notices as NoticeItem[]) || [],
    inquiries: (wsData.inquiries as InquiryItem[]) || [],
    securityConfig: wsData.securityConfig as SecurityConfig,
    securityLogs: (wsData.securityLogs as SecurityLogItem[]) || [],
    feeReminderSettings: wsData.feeReminderSettings as FeeReminderSettings,
    feeReminders: (wsData.feeReminders as FeeReminderLogItem[]) || []
  };

  return {
    bundle,
    meta: {
      syncedByEmail: String(wsData.syncedByEmail || ''),
      studentCount: students.length,
      batchCount: bundle.batches.length,
      deviceLabel: String(wsData.deviceLabel || 'Cloud Workspace'),
      updatedAtIso: t.iso,
      updatedAtMs: t.ms
    }
  };
}

export async function pullWorkspaceFromCloud(
  uid: string
): Promise<{ bundle: AppDataBundle; meta: CloudWorkspaceMeta } | null> {
  const [sqlResult, fsResult] = await Promise.allSettled([
    sqlRequest<{ bundle: AppDataBundle | null; meta: CloudWorkspaceMeta | null }>(
      '/api/workspace',
      { method: 'GET' }
    ),
    pullWorkspaceFromFirestore(uid)
  ]);

  const sqlData =
    sqlResult.status === 'fulfilled' &&
    sqlResult.value?.bundle &&
    sqlResult.value?.meta
      ? { bundle: sqlResult.value.bundle, meta: sqlResult.value.meta }
      : null;
  const fsData = fsResult.status === 'fulfilled' ? fsResult.value : null;

  if (sqlData && fsData) {
    return sqlData.meta.updatedAtMs >= fsData.meta.updatedAtMs ? sqlData : fsData;
  }
  if (sqlData) return sqlData;
  if (fsData) return fsData;

  if (fsResult.status === 'rejected' && sqlResult.status === 'rejected') {
    throw fsResult.reason;
  }
  return null;
}

async function createFirestoreBackupSnapshot(
  uid: string,
  userEmail: string,
  backupId: string,
  label: string,
  clean: AppDataBundle
): Promise<CloudBackupEntry> {
  const backupPath = `users/${uid}/backups/${backupId}`;
  const summary = computeBundleSummary(clean);

  const workspaceData = {
    instituteConfig: clean.instituteConfig,
    staffList: clean.staffList.slice(0, 300),
    batches: clean.batches.slice(0, 300),
    feePlans: clean.feePlans.slice(0, 100),
    notices: clean.notices.slice(0, 500),
    inquiries: clean.inquiries.slice(0, 500),
    securityConfig: clean.securityConfig,
    securityLogs: clean.securityLogs.slice(0, 200),
    feeReminderSettings: clean.feeReminderSettings,
    feeReminders: clean.feeReminders.slice(0, 500)
  };

  try {
    const firstChunk = clean.students.slice(0, 399);
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid, 'backups', backupId), {
      ownerUid: uid,
      backupId,
      label: (label.trim() || 'Manual Cloud Backup').slice(0, 120),
      createdByEmail: (userEmail || 'admin').slice(0, 160),
      formatVersion: BACKUP_SCHEMA_VERSION,
      instituteName: summary.instituteName.slice(0, 160),
      studentCount: summary.studentCount,
      batchCount: summary.batchCount,
      totalCollected: summary.totalFeeCollected,
      workspaceData,
      createdAt: serverTimestamp()
    });

    for (const stu of firstChunk) {
      const stuId = sanitizeDocId(stu.id);
      batch.set(doc(db, 'users', uid, 'backups', backupId, 'students', stuId), {
        ownerUid: uid,
        backupId,
        studentId: stuId,
        record: stu,
        createdAt: serverTimestamp()
      });
    }
    await batch.commit();

    for (let i = 399; i < clean.students.length; i += 400) {
      const chunk = clean.students.slice(i, i + 400);
      const nextBatch = writeBatch(db);
      for (const stu of chunk) {
        const stuId = sanitizeDocId(stu.id);
        nextBatch.set(
          doc(db, 'users', uid, 'backups', backupId, 'students', stuId),
          {
            ownerUid: uid,
            backupId,
            studentId: stuId,
            record: stu,
            createdAt: serverTimestamp()
          }
        );
      }
      await nextBatch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, backupPath);
  }

  return {
    backupId,
    label: label.trim() || 'Manual Cloud Backup',
    createdByEmail: userEmail,
    instituteName: summary.instituteName,
    studentCount: summary.studentCount,
    batchCount: summary.batchCount,
    totalCollected: summary.totalFeeCollected,
    createdAtIso: new Date().toISOString(),
    createdAtMs: Date.now()
  };
}

export async function createCloudBackupSnapshot(
  uid: string,
  userEmail: string,
  label: string,
  bundle: AppDataBundle
): Promise<CloudBackupEntry> {
  const backupId = `bkp_${Date.now()}`;
  const clean = stripUndefinedDeep(bundle);

  const [sqlResult, fsResult] = await Promise.allSettled([
    sqlRequest<{ backup: CloudBackupEntry }>('/api/backups', {
      method: 'POST',
      body: JSON.stringify({
        backupKey: backupId,
        label: label.trim() || 'Manual Cloud Backup',
        bundle: clean
      })
    }),
    createFirestoreBackupSnapshot(uid, userEmail, backupId, label, clean)
  ]);

  if (sqlResult.status === 'fulfilled' && sqlResult.value?.backup) {
    return sqlResult.value.backup;
  }
  if (fsResult.status === 'fulfilled') {
    return fsResult.value;
  }
  if (sqlResult.status === 'rejected') {
    throw sqlResult.reason;
  }
  throw new Error('Failed to save cloud backup snapshot.');
}

async function listFirestoreBackups(uid: string): Promise<CloudBackupEntry[]> {
  const path = `users/${uid}/backups`;
  try {
    const q = query(
      collection(db, 'users', uid, 'backups'),
      where('ownerUid', '==', uid)
    );
    const snaps = await getDocs(q);
    return snaps.docs
      .map((bDoc) => {
        const d = bDoc.data();
        const t = formatTimestamp(d.createdAt);
        return {
          backupId: String(d.backupId || bDoc.id),
          label: String(d.label || 'Cloud Backup'),
          createdByEmail: String(d.createdByEmail || ''),
          instituteName: String(d.instituteName || ''),
          studentCount: Number(d.studentCount || 0),
          batchCount: Number(d.batchCount || 0),
          totalCollected: Number(d.totalCollected || 0),
          createdAtIso: t.iso,
          createdAtMs: t.ms
        };
      })
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function listCloudBackups(uid: string): Promise<CloudBackupEntry[]> {
  const [sqlResult, fsResult] = await Promise.allSettled([
    sqlRequest<{ backups: CloudBackupEntry[] }>('/api/backups', { method: 'GET' }),
    listFirestoreBackups(uid)
  ]);

  const merged = new Map<string, CloudBackupEntry>();
  if (fsResult.status === 'fulfilled') {
    for (const item of fsResult.value) {
      merged.set(item.backupId, item);
    }
  }
  if (sqlResult.status === 'fulfilled' && Array.isArray(sqlResult.value?.backups)) {
    for (const item of sqlResult.value.backups) {
      merged.set(item.backupId, item);
    }
  }

  if (
    merged.size === 0 &&
    sqlResult.status === 'rejected' &&
    fsResult.status === 'rejected'
  ) {
    throw fsResult.reason;
  }

  return Array.from(merged.values()).sort((a, b) => b.createdAtMs - a.createdAtMs);
}

async function restoreFirestoreBackupSnapshot(
  uid: string,
  backupId: string
): Promise<AppDataBundle> {
  const backupPath = `users/${uid}/backups/${backupId}`;
  const studentsPath = `users/${uid}/backups/${backupId}/students`;

  let wsData: Record<string, unknown> = {};
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'backups', backupId));
    if (!snap.exists()) {
      throw new Error('Selected cloud backup snapshot was not found.');
    }
    wsData = (snap.data().workspaceData || {}) as Record<string, unknown>;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, backupPath);
  }

  const students: StudentRecord[] = [];
  try {
    const stuSnaps = await getDocs(
      query(
        collection(db, 'users', uid, 'backups', backupId, 'students'),
        where('ownerUid', '==', uid)
      )
    );
    stuSnaps.forEach((sDoc) => {
      const data = sDoc.data();
      if (data?.record) {
        students.push(data.record as StudentRecord);
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, studentsPath);
  }

  return {
    instituteConfig: wsData.instituteConfig as InstituteConfig,
    staffList: (wsData.staffList as StaffMember[]) || [],
    batches: (wsData.batches as BatchItem[]) || [],
    feePlans: (wsData.feePlans as FeePlan[]) || [],
    students,
    notices: (wsData.notices as NoticeItem[]) || [],
    inquiries: (wsData.inquiries as InquiryItem[]) || [],
    securityConfig: wsData.securityConfig as SecurityConfig,
    securityLogs: (wsData.securityLogs as SecurityLogItem[]) || [],
    feeReminderSettings: wsData.feeReminderSettings as FeeReminderSettings,
    feeReminders: (wsData.feeReminders as FeeReminderLogItem[]) || []
  };
}

export async function restoreCloudBackupSnapshot(
  uid: string,
  backupId: string
): Promise<AppDataBundle> {
  const [sqlResult, fsResult] = await Promise.allSettled([
    sqlRequest<{ bundle: AppDataBundle }>(
      `/api/backups/${encodeURIComponent(backupId)}`,
      { method: 'GET' }
    ),
    restoreFirestoreBackupSnapshot(uid, backupId)
  ]);

  if (sqlResult.status === 'fulfilled' && sqlResult.value?.bundle) {
    return sqlResult.value.bundle;
  }
  if (fsResult.status === 'fulfilled') {
    return fsResult.value;
  }
  if (fsResult.status === 'rejected') {
    throw fsResult.reason;
  }
  throw new Error('Selected cloud backup snapshot was not found.');
}

async function deleteFirestoreBackupSnapshot(
  uid: string,
  backupId: string
): Promise<void> {
  const backupPath = `users/${uid}/backups/${backupId}`;
  const studentsPath = `users/${uid}/backups/${backupId}/students`;

  try {
    const stuSnaps = await getDocs(
      query(
        collection(db, 'users', uid, 'backups', backupId, 'students'),
        where('ownerUid', '==', uid)
      )
    );
    for (let i = 0; i < stuSnaps.docs.length; i += 400) {
      const chunk = stuSnaps.docs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((sDoc) => batch.delete(sDoc.ref));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, studentsPath);
  }

  try {
    await deleteDoc(doc(db, 'users', uid, 'backups', backupId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, backupPath);
  }
}

export async function deleteCloudBackupSnapshot(
  uid: string,
  backupId: string
): Promise<void> {
  const [sqlResult, fsResult] = await Promise.allSettled([
    sqlRequest<{ deleted: boolean }>(
      `/api/backups/${encodeURIComponent(backupId)}`,
      { method: 'DELETE' }
    ),
    deleteFirestoreBackupSnapshot(uid, backupId)
  ]);

  if (sqlResult.status === 'rejected' && fsResult.status === 'rejected') {
    throw fsResult.reason;
  }
}
