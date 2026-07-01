import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { noteService } from '../services/note-service';
import {
  createNoteSchema,
  idParamSchema,
  brewIdParamSchema,
} from '../lib/validators';

const noteRouter = new Hono();

// GET /api/brews/:brewId/notes — list notes for a brew
noteRouter.get(
  '/brews/:brewId/notes',
  zValidator('param', brewIdParamSchema),
  async (c) => {
    const { brewId } = c.req.valid('param');

    const brewExists = await noteService.brewExists(brewId);
    if (!brewExists) return c.json({ error: 'Brew session not found' }, 404);

    const notes = await noteService.listByBrew(brewId);
    return c.json(notes);
  }
);

// POST /api/brews/:brewId/notes — create a note for a brew
noteRouter.post(
  '/brews/:brewId/notes',
  zValidator('param', brewIdParamSchema),
  zValidator('json', createNoteSchema),
  async (c) => {
    const { brewId } = c.req.valid('param');
    const data = c.req.valid('json');

    const brewExists = await noteService.brewExists(brewId);
    if (!brewExists) return c.json({ error: 'Brew session not found' }, 404);

    const note = await noteService.create(brewId, data);
    return c.json(note, 201);
  }
);

// DELETE /api/notes/:id — delete a single note
noteRouter.delete(
  '/notes/:id',
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await noteService.delete(id);
    if (!deleted) return c.json({ error: 'Tasting note not found' }, 404);
    return c.body(null, 204);
  }
);

export default noteRouter;
