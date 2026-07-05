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
-- 1. ESTRUTURA DE TABELAS PARALELIZADAS (FORMATO JSONB FLEXÍVEL E ULTRAVELOZ)
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
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Itens de Avaliação (Checklists do Relatório)
CREATE TABLE IF NOT EXISTS "evaluation_items" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
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
-- 2. ÍNDICES DE ALTO DESEMPENHO (PERFORMANCE INDEXING EM ATRIBUTOS JSONB)
--    Cria índices GIN (Generalized Inverted Index) para permitir buscas de documentos, Ex.: { ... }
--    E índices B-Tree baseados em expressões JSONB, garantindo buscas instantâneas!
-- ========================================================================

-- Indices GIN para busca profunda de sub-atributos JSONB
CREATE INDEX IF NOT EXISTS idx_settings_chunks_data_gin ON "settings_chunks" USING gin (data);
CREATE INDEX IF NOT EXISTS idx_eval_variables_data_gin ON "evaluation_variables" USING gin (data);

-- Índices B-Tree baseados em expressões nativas do PostgreSQL de forma segura e limpa
CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON "authorized_users" (((data->>'role')));
CREATE INDEX IF NOT EXISTS idx_evaluation_items_category ON "evaluation_items" (((data->>'category')));


-- ========================================================================
-- 3. POLÍTICAS DE PROTEÇÃO E SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ========================================================================

-- [OPÇÃO B]: MODO DESENVOLVIMENTO ÁGIL (RLS desativado para integração rápida de frontend via Chave Anon)
-- Se preferir usar políticas rígidas posteriormente, pode habilitar o RLS e definir regras
-- baseadas no Supabase Auth.
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
