-- Rode este script no Supabase: SQL Editor > New query > Run

create table if not exists public.categorias (
  id    bigint generated always as identity primary key,
  nome  text not null unique check (char_length(nome) between 1 and 40)
);

create table if not exists public.gastos (
  id            bigint generated always as identity primary key,
  descricao     text not null check (char_length(descricao) between 1 and 100),
  valor         numeric(12,2) not null check (valor > 0),
  data          date not null default current_date,
  categoria_id  bigint not null references public.categorias(id),  -- sem "on delete": nao apaga categoria em uso
  criado_em     timestamptz not null default now()
);

-- Chaves estrangeiras nao ganham indice automatico no PostgreSQL.
create index if not exists gastos_categoria_id_idx on public.gastos (categoria_id);
create index if not exists gastos_data_idx on public.gastos (data desc);

-- Seguranca: RLS ligado e sem policies = a chave publica do Supabase nao
-- le nem escreve nada. So o nosso backend (senha do banco) acessa.
alter table public.categorias enable row level security;
alter table public.gastos     enable row level security;

-- Dados de exemplo (opcional)
insert into public.categorias (nome) values ('Alimentacao'), ('Transporte'), ('Lazer'), ('Estudos')
on conflict (nome) do nothing;

insert into public.gastos (descricao, valor, data, categoria_id)
select * from (
  select 'Almoco no restaurante' as descricao, 32.50 as valor, current_date as data, id from public.categorias where nome = 'Alimentacao'
  union all
  select 'Onibus', 5.20, current_date, id from public.categorias where nome = 'Transporte'
  union all
  select 'Cinema', 40.00, current_date - 2, id from public.categorias where nome = 'Lazer'
) exemplo
where not exists (select 1 from public.gastos);  -- so insere se a tabela estiver vazia
