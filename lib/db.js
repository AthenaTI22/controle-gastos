import 'dotenv/config';
import pg from 'pg';

const obrigatorias = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const faltando = obrigatorias.filter(
  (nome) => !process.env[nome] || process.env[nome].startsWith('COLE_AQUI')
);
if (faltando.length) {
  throw new Error(`Variaveis ausentes: ${faltando.join(', ')}`);
}

const { Pool } = pg;

// Em serverless cada instancia deve abrir poucas conexoes (max: 1) e
// reaproveitar o pool entre requisicoes quando a funcao continua "quente".
export const pool = (globalThis.__pool ??= new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // Supabase exige TLS
  connectionTimeoutMillis: 10000,
  max: 1
}));
