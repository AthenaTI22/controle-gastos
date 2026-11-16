import { pool } from '../lib/db.js';

try {
  const { rows } = await pool.query(
    'select (select count(*)::int from public.categorias) as categorias, (select count(*)::int from public.gastos) as gastos'
  );
  console.log('Conexao OK.', rows[0]);
} catch (e) {
  console.error('Falha:', e.code ?? '', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
