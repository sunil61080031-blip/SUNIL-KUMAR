import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  createSqlBackup,
  deleteSqlBackup,
  getSqlBackupPayload,
  listSqlBackups,
  loadWorkspaceFromSql,
  saveWorkspaceToSql
} from './src/db/workspace.ts';
import type { SqlWorkspaceBundle } from './src/db/schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // Authenticated Cloud SQL API routes
  app.get('/api/workspace', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const data = await loadWorkspaceFromSql(uid);
      return res.json(data || { bundle: null, meta: null });
    } catch (error: unknown) {
      console.error('GET /api/workspace failed:', error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load workspace from SQL database'
      });
    }
  });

  app.put('/api/workspace', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'admin@local';
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const { bundle, deviceLabel } = req.body as {
        bundle?: SqlWorkspaceBundle;
        deviceLabel?: string;
      };
      if (!bundle || !bundle.instituteConfig) {
        return res.status(400).json({ error: 'Invalid workspace payload' });
      }

      const meta = await saveWorkspaceToSql(
        uid,
        email,
        bundle,
        deviceLabel || 'Web Admin Console'
      );
      return res.json({ meta });
    } catch (error: unknown) {
      console.error('PUT /api/workspace failed:', error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save workspace to SQL database'
      });
    }
  });

  app.get('/api/backups', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const backups = await listSqlBackups(uid);
      return res.json({ backups });
    } catch (error: unknown) {
      console.error('GET /api/backups failed:', error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch backups from SQL database'
      });
    }
  });

  app.post('/api/backups', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'admin@local';
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const { backupKey, label, bundle } = req.body as {
        backupKey?: string;
        label?: string;
        bundle?: SqlWorkspaceBundle;
      };
      if (!bundle || !bundle.instituteConfig) {
        return res.status(400).json({ error: 'Invalid backup payload' });
      }

      const key = (backupKey || `bkp_${Date.now()}`).slice(0, 120);
      const entry = await createSqlBackup(
        uid,
        email,
        key,
        (label || 'Cloud Snapshot').trim(),
        bundle
      );
      return res.status(201).json({ backup: entry });
    } catch (error: unknown) {
      console.error('POST /api/backups failed:', error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save backup snapshot to SQL database'
      });
    }
  });

  app.get(
    '/api/backups/:backupKey',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const uid = req.user?.uid;
        if (!uid) return res.status(401).json({ error: 'Unauthorized' });
        const payload = await getSqlBackupPayload(uid, String(req.params.backupKey));
        if (!payload) {
          return res.status(404).json({ error: 'Backup snapshot not found' });
        }
        return res.json({ bundle: payload });
      } catch (error: unknown) {
        console.error('GET /api/backups/:backupKey failed:', error);
        return res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to restore backup snapshot'
        });
      }
    }
  );

  app.delete(
    '/api/backups/:backupKey',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const uid = req.user?.uid;
        if (!uid) return res.status(401).json({ error: 'Unauthorized' });
        await deleteSqlBackup(uid, String(req.params.backupKey));
        return res.json({ deleted: true });
      } catch (error: unknown) {
        console.error('DELETE /api/backups/:backupKey failed:', error);
        return res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to delete backup snapshot'
        });
      }
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      try {
        const url = req.originalUrl;
        const fs = await import('fs');
        const templatePath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
