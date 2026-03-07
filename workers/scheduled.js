// Scheduled cron handler: runs every hour (0 * * * *)
// Deletes expired clips from D1 and their associated R2 objects.

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runCleanup(env));
  },
};

async function runCleanup(env) {
  // Find all expired clips
  const expired = await env.DB.prepare(
    `SELECT slug FROM clips WHERE expires_at IS NOT NULL AND expires_at < unixepoch()`
  ).all();

  if (!expired.results || expired.results.length === 0) {
    return;
  }

  for (const row of expired.results) {
    const slug = row.slug;

    try {
      // Fetch all R2 keys for this clip's files
      const files = await env.DB.prepare(
        'SELECT r2_key FROM clip_files WHERE clip_slug = ?'
      )
        .bind(slug)
        .all();

      if (files.results && files.results.length > 0) {
        await Promise.all(files.results.map((f) => env.FILES.delete(f.r2_key)));
      }

      // Delete the clip row (CASCADE removes clip_files rows)
      await env.DB.prepare('DELETE FROM clips WHERE slug = ?').bind(slug).run();
    } catch (e) {
      // Log and continue — do not let one failure block others
      console.error(`Failed to clean up clip "${slug}":`, e);
    }
  }
}
