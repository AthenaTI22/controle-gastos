import { pool } from '../lib/db.js';

function lerId(req) {
  const id = Number(req.query.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET': {
        const { rows } = await pool.query('select id, nome from public.categorias order by nome');
        return res.status(200).json(rows);
      }

      case 'POST': {
        const nome = String(req.body?.nome ?? '').trim();
        if (!nome || nome.length > 40) {
          return res.status(400).json({ erro: 'Informe um nome de 1 a 40 caracteres.' });
        }
        const { rows } = await pool.query(
          'insert into public.categorias (nome) values ($1) returning id, nome',
          [nome]
        );
        return res.status(201).json(rows[0]);
      }

      case 'DELETE': {
        const id = lerId(req);
        if (!id) return res.status(400).json({ erro: 'Envie ?id= com o numero da categoria.' });
        const { rowCount } = await pool.query('delete from public.categorias where id = $1', [id]);
        if (!rowCount) return res.status(404).json({ erro: 'Categoria nao encontrada.' });
        return res.status(204).end();
      }

      default:
        res.setHeader('Allow', 'GET, POST, DELETE');
        return res.status(405).json({ erro: 'Metodo nao permitido.' });
    }
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Essa categoria ja existe.' });
    if (e.code === '23503') {
      return res.status(409).json({ erro: 'Ha gastos nessa categoria. Exclua ou mude esses gastos primeiro.' });
    }
    console.error('Erro em /api/categorias:', e.code, e.message);
    return res.status(500).json({ erro: 'Nao foi possivel acessar o banco de dados.' });
  }
}
