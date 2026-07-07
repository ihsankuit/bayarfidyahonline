import { json } from '../../_lib/response.js';
import { verifySession } from '../../_lib/auth.js';

export const onRequest = async (context) => {
  const { request, env } = context;

  if (request.method === 'GET') {
    try {
      const stmt = env.DB.prepare('SELECT position, image_url FROM gallery_images ORDER BY position ASC');
      const images = stmt.all();
      return json(images);
    } catch (err) {
      return json({ error: 'Failed to fetch gallery' }, 500);
    }
  }

  if (request.method === 'PUT') {
    const sessionUser = await verifySession(request, env);
    if (!sessionUser) {
      return json({ error: 'Unauthorized' }, 401);
    }

    try {
      const body = await request.json();
      const { position, image_url } = body;

      if (!position || position < 1 || position > 6) {
        return json({ error: 'Position must be 1-6' }, 400);
      }

      const stmt = env.DB.prepare('UPDATE gallery_images SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE position = ?');
      stmt.run(image_url || null, position);

      const updated = env.DB.prepare('SELECT position, image_url FROM gallery_images WHERE position = ?').get(position);
      return json(updated);
    } catch (err) {
      return json({ error: 'Failed to update gallery image' }, 500);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
};
