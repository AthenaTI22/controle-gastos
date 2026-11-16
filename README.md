# Controle de gastos — Vercel + Git + Supabase

Aplicação para registrar gastos por categoria, com total geral e total por categoria.

| Camada | Tecnologia | Onde está |
|---|---|---|
| Frontend | HTML/CSS/JS puro | `public/index.html` |
| Backend | Funções serverless Node.js (Vercel) | `api/categorias.js`, `api/gastos.js`, `api/resumo.js`, `lib/db.js` |
| Banco de dados | PostgreSQL (Supabase) | `sql/schema.sql` |
| Versionamento | Git + GitHub | — |
| Deploy | Vercel (automático a cada `git push`) | — |

Fluxo: navegador → `/api/...` (Vercel) → PostgreSQL (Supabase).
A senha do banco fica só nas variáveis de ambiente do servidor; o navegador nunca a vê.

## Banco de dados

Duas tabelas ligadas por chave estrangeira: `categorias (1) ── (N) gastos`.
A tabela `gastos` tem `categoria_id` referenciando `categorias(id)`, então não é possível excluir
uma categoria que ainda tem gastos (a API responde com uma mensagem explicando).
O total por categoria (`api/resumo.js`) usa `LEFT JOIN` + `GROUP BY` + `SUM`.

## API

| Rota | Métodos | Para quê |
|---|---|---|
| `/api/categorias` | GET, POST, DELETE `?id=` | Listar, criar e excluir categorias |
| `/api/gastos` | GET, POST, PATCH `?id=`, DELETE `?id=` | CRUD dos gastos |
| `/api/resumo` | GET | Total geral e total por categoria |

## 1. Supabase

1. Crie um projeto em supabase.com e guarde a senha do banco.
2. **SQL Editor → New query**: cole `sql/schema.sql` e clique em **Run**.
3. Em **Table Editor**, confirme que `categorias` e `gastos` existem.
4. Clique em **Connect** e copie os dados do **Session Pooler** (host, porta, banco e usuário
   no formato `postgres.xxxxxxxx`).

## 2. Rodar na sua máquina

```bash
npm install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
# preencha o .env com os dados do passo 1.4
npm run test:db             # deve mostrar "Conexao OK"
npx vercel dev              # http://localhost:3000
```

## 3. Git e GitHub

Crie antes um repositório vazio no GitHub (sem README).

```bash
git init
git add .
git status                  # confirme que o .env NAO aparece
git commit -m "Primeira versao: frontend, API e banco"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/controle-gastos.git
git push -u origin main
```

Depois, faça commits pequenos a cada mudança (`git commit -m "Adiciona edicao de gastos"`).

## 4. Vercel

1. Em vercel.com: **Add New → Project** e importe o repositório.
2. Framework Preset: **Other**. Sem Build Command.
3. **Environment Variables**: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
4. **Deploy**. Cada `git push` na `main` publica uma nova versão.

## Problemas comuns

- **"Nao foi possivel acessar o banco"**: veja os **Logs** na Vercel e confira as 5 variáveis
  (depois de alterá-las, faça **Redeploy**).
- **`password authentication failed`**: usuário ou senha errados (use o usuário do Session Pooler).
- **`relation "public.gastos" does not exist`**: o `schema.sql` não foi executado.
- **`ECONNRESET` / timeout**: host ou porta do pooler errados, ou rede bloqueando a porta.
- **Lista dá erro 404**: a pasta `api/` precisa estar na raiz do repositório.

## Segurança

- Nunca suba `.env` ao Git. Se a senha vazar, redefina em **Project Settings → Database**.
- Tabelas com RLS ligado e sem policies: a chave pública do Supabase não acessa os dados.
