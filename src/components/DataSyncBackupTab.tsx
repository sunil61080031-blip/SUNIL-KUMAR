import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudOff,
  CloudUpload,
  Database,
  Download,
  FileCheck2,
  FileJson,
  History,
  LogIn,
  LogOut,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload
} from 'lucide-react';
import {
  AppDataBundle,
  BackupFileEnvelope,
  buildLocalBackupEnvelope,
  CloudBackupEntry,
  CloudWorkspaceMeta,
  computeBundleSummary,
  parseAndValidateBackupJson,
  RestoreScopeSelection
} from '../utils/backupSyncHelpers';

export interface CloudUserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

interface DataSyncBackupTabProps {
  bundle: AppDataBundle;
  cloudUser: CloudUserInfo | null;
  cloudSyncState: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  cloudSyncError: string | null;
  autoCloudSync: boolean;
  onToggleAutoCloudSync: (enabled: boolean) => void;
  lastSyncedMeta: CloudWorkspaceMeta | null;
  cloudRemoteMeta: CloudWorkspaceMeta | null;
  cloudBackups: CloudBackupEntry[];
  isCloudLoading: boolean;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onPushToCloud: () => Promise<void>;
  onPullFromCloud: () => Promise<void>;
  onCreateCloudBackup: (label: string) => Promise<void>;
  onRestoreCloudBackup: (backupId: string, label: string) => Promise<void>;
  onDeleteCloudBackup: (backupId: string) => Promise<void>;
  onRefreshCloudState: () => Promise<void>;
  onApplyRestoreBundle: (
    data: AppDataBundle,
    scope: RestoreScopeSelection,
    sourceLabel: string
  ) => void;
  onShowToast: (msg: string) => void;
}

export const DataSyncBackupTab: React.FC<DataSyncBackupTabProps> = ({
  bundle,
  cloudUser,
  cloudSyncState,
  cloudSyncError,
  autoCloudSync,
  onToggleAutoCloudSync,
  lastSyncedMeta,
  cloudRemoteMeta,
  cloudBackups,
  isCloudLoading,
  onSignInGoogle,
  onSignOutGoogle,
  onPushToCloud,
  onPullFromCloud,
  onCreateCloudBackup,
  onRestoreCloudBackup,
  onDeleteCloudBackup,
  onRefreshCloudState,
  onApplyRestoreBundle,
  onShowToast
}) => {
  const localSummary = useMemo(() => computeBundleSummary(bundle), [bundle]);

  const [backupLabelInput, setBackupLabelInput] = useState(
    `Backup ${new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}`
  );
  const [confirmPullCloud, setConfirmPullCloud] = useState(false);
  const [confirmRestoreBackupId, setConfirmRestoreBackupId] = useState<string | null>(
    null
  );
  const [confirmDeleteBackupId, setConfirmDeleteBackupId] = useState<string | null>(
    null
  );

  // Local JSON Backup & Restore state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsedRestoreEnvelope, setParsedRestoreEnvelope] =
    useState<BackupFileEnvelope | null>(null);
  const [restoreChecksumVerified, setRestoreChecksumVerified] = useState(false);
  const [restoreParseError, setRestoreParseError] = useState<string | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [restoreScope, setRestoreScope] = useState<RestoreScopeSelection>({
    instituteAndCentres: true,
    studentsAndLedgers: true,
    batchesAndFees: true,
    staffAndNotices: true,
    securityAndReminders: true
  });

  const handleDownloadJsonBackup = async () => {
    const envelope = await buildLocalBackupEnvelope(
      bundle,
      cloudUser?.email || 'Admin Console'
    );
    const jsonString = JSON.stringify(envelope, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SNTC_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(
      `Downloaded SHA-256 verified backup (${envelope.summary.studentCount} students)!`
    );
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFileName(file.name);
    setRestoreParseError(null);
    setParsedRestoreEnvelope(null);

    try {
      const text = await file.text();
      const result = await parseAndValidateBackupJson(text);
      if (!result.valid || !result.envelope) {
        setRestoreParseError(result.error || 'Unsupported backup file.');
        return;
      }
      setParsedRestoreEnvelope(result.envelope);
      setRestoreChecksumVerified(result.checksumVerified);
    } catch (err) {
      setRestoreParseError(
        err instanceof Error ? err.message : 'Unable to read selected file.'
      );
    }
  };

  const handleConfirmFileRestore = () => {
    if (!parsedRestoreEnvelope) return;
    onApplyRestoreBundle(
      parsedRestoreEnvelope.data,
      restoreScope,
      `JSON File (${restoreFileName || 'Local Backup'})`
    );
    setParsedRestoreEnvelope(null);
    setRestoreFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onShowToast('Backup data restored successfully to this device!');
  };

  const handleCreateCloudBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupLabelInput.trim()) return;
    await onCreateCloudBackup(backupLabelInput.trim());
    setBackupLabelInput(
      `Snapshot ${new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })}`
    );
  };

  const formatIsoDisplay = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Dataset Overview Strip */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold">
              Online Data Sync, Cloud Snapshots & Local Backup
            </h3>
            <p className="text-[11px] text-slate-300">
              Current Active Device Data:{' '}
              <strong className="text-emerald-300">
                {localSummary.studentCount} Students
              </strong>{' '}
              · <strong>{localSummary.batchCount} Batches</strong> ·{' '}
              <strong>{localSummary.staffCount} Staff</strong> ·{' '}
              <strong>₹{localSummary.totalFeeCollected.toLocaleString('en-IN')} Collected</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${
              cloudSyncState === 'synced'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : cloudSyncState === 'syncing'
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : cloudSyncState === 'error'
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {cloudSyncState === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : cloudUser ? (
              <Cloud className="w-3.5 h-3.5" />
            ) : (
              <CloudOff className="w-3.5 h-3.5" />
            )}
            <span>
              {!cloudUser
                ? 'Local Only (Cloud Not Connected)'
                : cloudSyncState === 'syncing'
                ? 'Syncing with Cloud...'
                : cloudSyncState === 'synced'
                ? 'Cloud Connected & Synced'
                : cloudSyncState === 'error'
                ? 'Sync Error'
                : 'Cloud Ready'}
            </span>
          </span>
        </div>
      </div>

      {/* Main 2-Column Layout: Cloud Sync + Cloud Snapshots | Local JSON Backup & Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: ONLINE CLOUD SYNC & CLOUD BACKUP SNAPSHOTS */}
        <div className="space-y-5">
          {/* Card 1: Online Cloud Sync (Google Auth + Firestore) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-700" />
                  <span>1. Online Cloud Data Sync</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sign in with Google to sync students, fee ledgers, attendance & settings across devices.
                </p>
              </div>
              {cloudUser && (
                <button
                  type="button"
                  disabled={isCloudLoading}
                  onClick={onRefreshCloudState}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 cursor-pointer disabled:opacity-50"
                  title="Refresh cloud status & backups"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isCloudLoading ? 'animate-spin' : ''}`}
                  />
                </button>
              )}
            </div>

            {cloudSyncError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="break-words">
                  <p className="font-bold">Cloud Sync Error</p>
                  <p className="text-[11px] mt-0.5">{cloudSyncError}</p>
                </div>
              </div>
            )}

            {!cloudUser ? (
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-3">
                <p className="text-xs text-slate-600">
                  Connect your verified Google account to enable real-time cloud synchronization and encrypted cloud restore points.
                </p>
                <button
                  type="button"
                  disabled={isCloudLoading}
                  onClick={onSignInGoogle}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {isCloudLoading
                      ? 'Connecting Google Account...'
                      : 'Sign in with Google to Enable Cloud Sync'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Connected Account Info */}
                <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {cloudUser.displayName || 'Connected Account'}
                      </span>
                      {cloudUser.emailVerified && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {cloudUser.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onSignOutGoogle}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>

                {/* Cloud Remote Status Summary */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Cloud Workspace State:</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-800">
                      {cloudRemoteMeta
                        ? `${cloudRemoteMeta.studentCount} Students · ${cloudRemoteMeta.batchCount} Batches`
                        : 'No Cloud Data Uploaded Yet'}
                    </span>
                  </div>
                  {(lastSyncedMeta || cloudRemoteMeta) && (
                    <p className="text-[11px] text-slate-500">
                      Last Cloud Sync:{' '}
                      <strong>
                        {formatIsoDisplay(
                          (lastSyncedMeta || cloudRemoteMeta)!.updatedAtIso
                        )}
                      </strong>
                    </p>
                  )}
                </div>

                {/* Auto-Sync Toggle */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Auto-Sync Local Changes to Cloud
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Automatically pushes student, fee & batch edits online
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCloudSync}
                    onChange={(e) => onToggleAutoCloudSync(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>

                {/* Push / Pull Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isCloudLoading || cloudSyncState === 'syncing'}
                    onClick={onPushToCloud}
                    className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>Push Local → Cloud</span>
                  </button>

                  {!confirmPullCloud ? (
                    <button
                      type="button"
                      disabled={
                        isCloudLoading ||
                        cloudSyncState === 'syncing' ||
                        !cloudRemoteMeta
                      }
                      onClick={() => setConfirmPullCloud(true)}
                      className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CloudDownload className="w-4 h-4" />
                      <span>Pull Cloud → Device</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          setConfirmPullCloud(false);
                          await onPullFromCloud();
                        }}
                        className="flex-1 py-2 px-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl cursor-pointer"
                      >
                        Confirm Overwrite
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmPullCloud(false)}
                        className="py-2 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Named Cloud Backup Restore Points */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                <span>2. Cloud Backup Restore Points ({cloudBackups.length})</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Save named cloud snapshots before promotions, fee changes, or bulk edits.
              </p>
            </div>

            {!cloudUser ? (
              <p className="text-xs text-slate-500 py-4 text-center bg-white rounded-xl border border-dashed border-slate-300">
                Sign in with Google above to create and restore cloud backup snapshots.
              </p>
            ) : (
              <>
                <form
                  onSubmit={handleCreateCloudBackupSubmit}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={backupLabelInput}
                    onChange={(e) => setBackupLabelInput(e.target.value)}
                    placeholder="Backup label (e.g. Before Class Promotion)"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                  <button
                    type="submit"
                    disabled={isCloudLoading}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Save Cloud Point</span>
                  </button>
                </form>

                {cloudBackups.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center bg-white rounded-xl border border-slate-200">
                    No cloud backup snapshots saved yet.
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {cloudBackups.map((bkp) => (
                      <div
                        key={bkp.backupId}
                        className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900">{bkp.label}</p>
                            <p className="text-[11px] text-slate-500">
                              {formatIsoDisplay(bkp.createdAtIso)} ·{' '}
                              <strong className="text-emerald-800">
                                {bkp.studentCount} Students
                              </strong>{' '}
                              · {bkp.batchCount} Batches · ₹
                              {bkp.totalCollected.toLocaleString('en-IN')}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {confirmRestoreBackupId === bkp.backupId ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isCloudLoading}
                                  onClick={async () => {
                                    setConfirmRestoreBackupId(null);
                                    await onRestoreCloudBackup(bkp.backupId, bkp.label);
                                  }}
                                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  Confirm Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRestoreBackupId(null)}
                                  className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : confirmDeleteBackupId === bkp.backupId ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isCloudLoading}
                                  onClick={async () => {
                                    setConfirmDeleteBackupId(null);
                                    await onDeleteCloudBackup(bkp.backupId);
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteBackupId(null)}
                                  className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRestoreBackupId(bkp.backupId)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Restore</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteBackupId(bkp.backupId)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Delete cloud backup"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: OFFLINE FULL APP DATA BACKUP & RESTORE (.JSON) */}
        <div className="space-y-5">
          {/* Card 3: Download Full Verified JSON Backup */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-700" />
                <span>3. Download Full App Backup (.JSON)</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Export an offline SHA-256 verified file containing all students, fee ledgers, attendance, batches, staff, notices, reminders & security settings.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-semibold">
                  Students
                </span>
                <span className="text-sm font-extrabold font-mono text-slate-900">
                  {localSummary.studentCount}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-semibold">
                  Batches
                </span>
                <span className="text-sm font-extrabold font-mono text-slate-900">
                  {localSummary.batchCount}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-semibold">
                  Staff
                </span>
                <span className="text-sm font-extrabold font-mono text-slate-900">
                  {localSummary.staffCount}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-semibold">
                  Notices
                </span>
                <span className="text-sm font-extrabold font-mono text-slate-900">
                  {localSummary.noticeCount}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadJsonBackup}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Backup File (.json with SHA-256 Checksum)</span>
            </button>
          </div>

          {/* Card 4: Restore from Backup File (.JSON) with Selective Preview */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>4. Restore App Data from Backup File</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload a saved <code className="font-mono">.json</code> backup file to inspect contents and restore all or selected sections.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 space-y-3 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelected}
                className="hidden"
                id="app-backup-restore-input"
              />
              <label
                htmlFor="app-backup-restore-input"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {restoreFileName
                    ? `Selected: ${restoreFileName}`
                    : 'Choose Backup File (.json)'}
                </span>
              </label>
              <p className="text-[11px] text-slate-500">
                Supports full SNTC backup files with automatic schema & checksum inspection.
              </p>
            </div>

            {restoreParseError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{restoreParseError}</span>
              </div>
            )}

            {parsedRestoreEnvelope && (
              <div className="bg-white p-4 rounded-xl border-2 border-emerald-300 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                    <FileCheck2 className="w-4 h-4 text-emerald-700" />
                    <span>Backup Inspection Preview</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                      restoreChecksumVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>
                      {restoreChecksumVerified
                        ? 'SHA-256 Integrity Verified'
                        : 'Valid JSON (No/Modified Checksum)'}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Institute:</span>
                    <strong className="text-slate-900">
                      {parsedRestoreEnvelope.summary.instituteName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Exported On:</span>
                    <strong className="text-slate-900">
                      {formatIsoDisplay(parsedRestoreEnvelope.exportedAt)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Students & Batches:</span>
                    <strong className="text-emerald-800">
                      {parsedRestoreEnvelope.summary.studentCount} Students ·{' '}
                      {parsedRestoreEnvelope.summary.batchCount} Batches
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fee Collected Total:</span>
                    <strong className="font-mono text-slate-900">
                      ₹
                      {parsedRestoreEnvelope.summary.totalFeeCollected.toLocaleString(
                        'en-IN'
                      )}
                    </strong>
                  </div>
                </div>

                {/* Selective Restore Scope Checkboxes */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-700">
                    Choose Data Sections to Restore:
                  </p>
                  {(
                    [
                      {
                        key: 'studentsAndLedgers',
                        label: `Students, Fee Ledgers & Attendance (${parsedRestoreEnvelope.data.students.length})`
                      },
                      {
                        key: 'batchesAndFees',
                        label: `Batches & Class Fee Plans (${parsedRestoreEnvelope.data.batches.length} Batches)`
                      },
                      {
                        key: 'instituteAndCentres',
                        label: `Institute Profile & Study Centres (${parsedRestoreEnvelope.data.instituteConfig.studyCentres.length})`
                      },
                      {
                        key: 'staffAndNotices',
                        label: `Faculty Staff, Notices & Inquiries (${parsedRestoreEnvelope.data.staffList.length} Staff, ${parsedRestoreEnvelope.data.notices.length} Notices)`
                      },
                      {
                        key: 'securityAndReminders',
                        label: 'Password / OTP Security Settings & Fee Reminders'
                      }
                    ] as { key: keyof RestoreScopeSelection; label: string }[]
                  ).map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-emerald-50/40"
                    >
                      <input
                        type="checkbox"
                        checked={restoreScope[item.key]}
                        onChange={(e) =>
                          setRestoreScope({
                            ...restoreScope,
                            [item.key]: e.target.checked
                          })
                        }
                        className="w-3.5 h-3.5 text-emerald-600 rounded"
                      />
                      <span className="text-[11px] font-semibold text-slate-800">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!Object.values(restoreScope).some(Boolean)}
                    onClick={handleConfirmFileRestore}
                    className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Restore Selected Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRestoreEnvelope(null);
                      setRestoreFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
