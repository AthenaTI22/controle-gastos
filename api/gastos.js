import { pool } from '../lib/db.js';

function lerId(req) {
  const id = Number(req.query.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Valida e normaliza o corpo de POST/PATCH. Retorna { erro } ou { dados }.
function validar(body) {
  const descricao = String(body?.descricao ?? '').trim();
  const valor = Math.round(Number(body?.valor) * 100) / 100;
  const data = String(body?.data ?? '');
  const categoriaId = Number(body?.categoria_id);

  if (!descricao || descricao.length > 100) return { erro: 'Descreva o gasto em ate 100 caracteres.' };
  if (!Number.isFinite(valor) || valor <= 0 || valor > 9999999999) return { erro: 'Informe um valor maior que zero.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) return { erro: 'Informe uma data valida.' };
  if (!Number.isSafeInteger(categoriaId) || categoriaId <= 0) return { erro: 'Escolha uma categoria.' };

  return { dados: [descricao, valor, data, categoriaId] };
}

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET': {
        const { rows } = await pool.query(
          `select g.id, g.descricao, g.valor::float8 as valor,
                  to_char(g.data, 'YYYY-MM-DD') as data,
                  g.categoria_id, c.nome as categoria
             from public.gastos g
             join public.categorias c on c.id = g.categoria_id
            order by g.data desc, g.id desc`
        );
        return res.status(200).json(rows);
      }

      case 'POST': {
        const { erro, dados } = validar(req.body);
        if (erro) return res.status(400).json({ erro });
        const { rows } = await pool.query(
          `insert into public.gastos (descricao, valor, data, categoria_id)
           values ($1, $2, $3, $4) returning id`,
          dados
        );
        return res.status(201).json(rows[0]);
      }

      case 'PATCH': {
        const id = lerId(req);
        if (!id) return res.status(400).json({ erro: 'Envie ?id= com o numero do gasto.' });
        const { erro, dados } = validar(req.body);
        if (erro) return res.status(400).json({ erro });
        const { rows } = await pool.query(
          `update public.gastos
              set descricao = $1, valor = $2, data = $3, categoria_id = $4
            where id = $5 returning id`,
          [...dados, id]
        );
        if (!rows.length) return res.status(404).json({ erro: 'Gasto nao encontrado.' });
        return res.status(200).json(rows[0]);
      }

      case 'DELETE': {
        const id = lerId(req);
        if (!id) return res.status(400).json({ erro: 'Envie ?id= com o numero do gasto.' });
        const { rowCount } = await pool.query('delete from public.gastos where id = $1', [id]);
        if (!rowCount) return res.status(404).json({ erro: 'Gasto nao encontrado.' });
        return res.status(204).end();
      }

      default:
        res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
        return res.status(405).json({ erro: 'Metodo nao permitido.' });
    }
  } catch (e) {
    if (e.code === '23503') return res.status(400).json({ erro: 'Essa categoria nao existe mais.' });
    console.error('Erro em /api/gastos:', e.code, e.message);
    return res.status(500).json({ erro: 'Nao foi possivel acessar o banco de dados.' });
  }
}
