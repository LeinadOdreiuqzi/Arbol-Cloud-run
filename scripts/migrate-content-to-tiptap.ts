import db from '../lib/db';
import { markdownToTiptapJson } from '../lib/tiptap-markdown';

async function migrate() {
  const result = await db.query('SELECT id, content FROM pages');
  for (const row of result.rows) {
    let isJson = false;
    try {
      JSON.parse(row.content);
      isJson = true;
    } catch {}
    if (!isJson && row.content) {
      // Migrar solo si NO es JSON
      const tiptapJson = await markdownToTiptapJson(row.content);
      await db.query('UPDATE pages SET content = $1 WHERE id = $2', [JSON.stringify(tiptapJson), row.id]);
      console.log(`Migrado id=${row.id}`);
    }
  }
  console.log('Migración terminada.');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
