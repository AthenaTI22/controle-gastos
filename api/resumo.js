import { pool } from '../lib/db.js';

// Total gasto por categoria (consulta com JOIN + GROUP BY).
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ erro: 'Metodo nao permitido.' });
  }
  try {
    const { rows } = await pool.query(
      `select c.id, c.nome,
              coalesce(sum(g.valor), 0)::float8 as total,
              count(g.id)::int as quantidade
         from public.categorias c
         left join public.gastos g on g.categoria_id = c.id
        group by c.id, c.nome
        order by total desc, c.nome`
    );
    const total = Math.round(rows.reduce((soma, r) => soma + r.total, 0) * 100) / 100;
    return res.status(200).json({ total, categorias: rows });
  } catch (e) {
    console.error('Erro em /api/resumo:', e.code, e.message);
    return res.status(500).json({ erro: 'Nao foi possivel acessar o banco de dados.' });
  }
}
