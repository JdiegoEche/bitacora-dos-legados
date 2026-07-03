import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';
import { noteService } from '../services/note-service';
import {
  createNoteSchema,
  idParamSchema,
  brewIdParamSchema,
} from '../lib/validators';

const noteRouter = new Hono();

// All note routes require authentication — apply only to specific paths
noteRouter.use('/brews/:brewId/notes', authMiddleware);
noteRouter.use('/notes/:id', authMiddleware);

// GET /api/brews/:brewId/notes — list notes for a brew (ownership checked)
noteRouter.get(
  '/brews/:brewId/notes',
  zValidator('param', brewIdParamSchema),
  async (c) => {
    const userId = c.get('userId');
    const { brewId } = c.req.valid('param');

    const ownsBrew = await noteService.brewBelongsToUser(brewId, userId);
    if (!ownsBrew) return c.json({ error: 'Brew session not found' }, 404);

    const notes = await noteService.listByBrew(brewId, userId);
    return c.json(notes);
  },
);

// POST /api/brews/:brewId/notes — create a note for a brew (ownership checked)
noteRouter.post(
  '/brews/:brewId/notes',
  zValidator('param', brewIdParamSchema),
  zValidator('json', createNoteSchema),
  async (c) => {
    const userId = c.get('userId');
    const { brewId } = c.req.valid('param');
    const data = c.req.valid('json');

    const note = await noteService.create(brewId, data, userId);
    if (!note) return c.json({ error: 'Brew session not found' }, 404);

    return c.json(note, 201);
  },
);

// DELETE /api/notes/:id — delete a single note (ownership verified via brew session)
noteRouter.delete(
  '/notes/:id',
  zValidator('param', idParamSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const deleted = await noteService.delete(id, userId);
    if (!deleted) return c.json({ error: 'Tasting note not found' }, 404);
    return c.body(null, 204);
  },
);

export default noteRouter;
