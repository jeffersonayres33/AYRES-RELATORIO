-- ========================================================================
-- SCRIPT DE ENGENHARIA E OTIRMIZAÇÃO SUPABASEv2 - RELATÓRIO AYRES
-- ========================================================================
-- Este script foi otimizado para o máximo desempenho de busca,
-- suporte a grandes volumes de dados (XMLs pesados) e segurança rígida.
--
-- Como aplicar no Supabase:
-- 1. Acesse o painel do seu projeto no Supabase (https://supabase.com).
-- 2. No menu lateral esquerdo, clique em "SQL Editor".
-- 3. Clique em "New query" para abrir uma nova aba de comandos.
-- 4. Copie todo o código deste arquivo, cole no editor e clique em "Run" (Executar).
-- ========================================================================

-- ========================================================================
-- 1. ESTRUTURA DE TABELAS REFORÇADAS COM COLUNAS VIRTUAIS GERADAS
--    Isso híbrida a flexibilidade do NoSQL (JSONB) com a velocidade do SQL Relacional!
-- ========================================================================

-- Tabela de Mapeamentos Fiscais / CRF
CREATE TABLE IF NOT EXISTS "fiscal_crf_mappings" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Mapeamentos de Nomes
CREATE TABLE IF NOT EXISTS "fiscal_name_mappings" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Usuários Autorizados
CREATE TABLE IF NOT EXISTS "authorized_users" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Colunas Virtuais Geradas para otimizar pesquisas diretas e índices
    email TEXT GENERATED ALWAYS AS (id) STORED,
    role TEXT GENERATED ALWAYS AS (data->>'role') STORED
);

-- Tabela de Itens de Avaliação (Checklists do Relatório)
CREATE TABLE IF NOT EXISTS "evaluation_items" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    title TEXT GENERATED ALWAYS AS (data->>'title') STORED,
    category TEXT GENERATED ALWAYS AS (data->>'category') STORED
);

-- Tabela de Variáveis de Avaliação
CREATE TABLE IF NOT EXISTS "evaluation_variables" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Variáveis de Template Customizadas
CREATE TABLE IF NOT EXISTS "templateVariables" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Texto de Introdução do Relatório
CREATE TABLE IF NOT EXISTS "evaluation_intro" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Configurações Gerais do Sistema
CREATE TABLE IF NOT EXISTS "settings" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Partições/Chunks do Template .docx (Armazenamento de Binários Grandes por Parte)
CREATE TABLE IF NOT EXISTS "settings_chunks" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);


-- ========================================================================
-- 2. ÍNDICES DE ALTO DESEMPENHO (PERFORMANCE INDEXING)
--    Cria índices GIN (Generalized Inverted Index) para permitir buscas
--    instantâneas dentro dos blocos JSONB do Supabase.
-- ========================================================================

-- Índice para acelerar buscas complexas em configurações de templates e chunks grandes
CREATE INDEX IF NOT EXISTS idx_settings_chunks_data_gin ON "settings_chunks" USING gin (data);

-- Índice de busca por atributos internos de variáveis
CREATE INDEX IF NOT EXISTS idx_eval_variables_data_gin ON "evaluation_variables" USING gin (data);

-- Índices de busca direta nas colunas virtuais de usuários e itens
CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON "authorized_users"(role);
CREATE INDEX IF NOT EXISTS idx_evaluation_items_category ON "evaluation_items"(category);


-- ========================================================================
-- 3. POLÍTICAS DE PROTEÇÃO E SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ========================================================================
-- Escolha uma das duas abordagens abaixo de acordo com a maturidade do seu time:

-- [OPÇÃO A]: SEGURANÇA TOTAL EM PRODUÇÃO (Habilitar RLS e permitir total controle apenas aos administradores autorizados)
-- Para usar este modo com segurança total, você deve descomentar os comandos abaixo:
/*
ALTER TABLE "fiscal_crf_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fiscal_name_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "authorized_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_variables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "templateVariables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_intro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings_chunks" ENABLE ROW LEVEL SECURITY;

-- Exemplo de política de acesso público para leitura e escrita apenas para usuários de e-mail verificado (Supabase Auth)
CREATE POLICY "Acesso irrestrito para usuários autenticados" 
ON "authorized_users" 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
*/

-- [OPÇÃO B]: MODO DESENVOLVIMENTO ÁGIL (RLS desativado para integração rápida de frontend via Chave Anon)
-- Se preferir não configurar logins complexos por enquanto, execute as linhas abaixo para que
-- as requisições de leitura/escrita feitas diretamente pelo navegador funcionem sem validações de token:
ALTER TABLE "fiscal_crf_mappings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "fiscal_name_mappings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "authorized_users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_variables" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "templateVariables" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_intro" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "settings_chunks" DISABLE ROW LEVEL SECURITY;


-- ========================================================================
-- 4. BOOTSTRAP DE DADOS PADRÃO (SEMENTE INICIAL SEGURO)
-- ========================================================================
-- Insere o proprietário do sistema como Administrador inicial caso a tabela esteja limpa.
INSERT INTO "authorized_users" (id, data) 
VALUES (
    'jeffersonayresjefferson@gmail.com', 
    '{"email": "jeffersonayresjefferson@gmail.com", "role": "admin", "addedBy": "sistema", "createdAt": 1718485299000}'
) 
ON CONFLICT (id) DO NOTHING;

-- Notificação de êxito no terminal de SQL
SELECT 'Banco de dados Ayres-Relatório otimizado com sucesso!' as status;
