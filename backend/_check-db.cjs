const postgres = require('postgres');

(async () => {
  try {
    const sql = postgres('postgres://postgres:Squareenix12345,.@localhost:5432/bitacora', { prepare: false });
    const r = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'brew_sessions' 
      ORDER BY ordinal_position
    `;
    console.log(JSON.stringify(r, null, 2));
    await sql.end();
  } catch(e) {
    console.error('DB error:', e.message);
  }
})();
