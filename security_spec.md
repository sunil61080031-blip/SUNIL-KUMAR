# Firestore Security Specification

## 1. Data Invariants
- Every document stored in Firestore belongs strictly to an authenticated, email-verified user (`request.auth.uid == userId && request.auth.token.email_verified == true`).
- Cross-tenant access to another user's workspace, student PII, or cloud backups is strictly denied (`allow read, write: if false;` catch-all default).
- Every student snapshot inside `/users/{userId}/backups/{backupId}/students/{studentId}` requires its parent `/users/{userId}/backups/{backupId}` document to exist and belong to `request.auth.uid` (Master Gate via `get()` / `exists()`).
- Timestamps (`createdAt`, `updatedAt`) are strictly server-enforced using `request.time`.
- `ownerUid` and `createdAt` are immutable once created.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Cross-Tenant Read**: User B attempts `get` on `/users/userA/workspaces/main` -> Denied (`isOwner(userA)` false).
2. **Unverified Email Write**: User A with `email_verified: false` attempts `create` on `/users/userA/workspaces/main` -> Denied (`isVerified()` false).
3. **Shadow Ghost Field**: User A attempts `create` on `/users/userA/workspaces/main` with extra field `isSuperAdmin: true` -> Denied (`keys().hasOnly(...)`).
4. **Identity Spoofing**: User A attempts `create` on `/users/userA/students/stu1` with `ownerUid: "userB"` -> Denied (`data.ownerUid == request.auth.uid`).
5. **Fake Client Timestamp**: User A attempts `create` on `/users/userA/backups/bkp1` with client-provided past `createdAt` -> Denied (`data.createdAt == request.time`).
6. **Immutable Field Mutation**: User A attempts `update` on `/users/userA/workspaces/main` changing `ownerUid` or `createdAt` -> Denied.
7. **ID Poisoning**: User A attempts `create` on `/users/userA/students/bad$id..with*chars` -> Denied (`isValidId(studentId)` fails).
8. **Type / Value Poisoning**: User A attempts `update` on `/users/userA/students/stu1` setting `studentName: 12345` or string > 120 chars -> Denied (`isValidSyncedStudent(incoming())`).
9. **Array Exhaustion**: User A attempts `create` on `/users/userA/workspaces/main` with `batches.size() > 500` -> Denied (`data.batches.size() <= 500`).
10. **Orphan Backup Student**: User A attempts `create` on `/users/userA/backups/nonexistent/students/stu1` -> Denied (Master Gate `exists()` / `get()` fails).
11. **Unrestricted List Query**: User B attempts `list` on `/users/userA/students` -> Denied (`isOwner(userId) && resource.data.ownerUid == request.auth.uid`).
12. **Blanket Root Access**: Any user attempts `read` or `write` on `/arbitrary/collection/doc` -> Denied by global catch-all `match /{document=**} { allow read, write: if false; }`.
