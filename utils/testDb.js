const { Client } = require('pg');
require('dotenv').config();

async function test() {
  const c = new Client();
  await c.connect();
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log(r.rows);
  await c.end();
}
test();
