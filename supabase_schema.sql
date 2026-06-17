-- ========================================================================
-- SCRIPT DE MIGRAÇÃO SUPABASE - RELATÓRIO AYRES
-- ========================================================================
-- Como usar:
-- 1. Acesse o painel do seu projeto no Supabase (https://supabase.com).
-- 2. No menu lateral esquerdo, clique em "SQL Editor".
-- 3. Clique em "New query" para abrir uma nova aba de comandos.
-- 4. Copie todo o código deste arquivo, cole na caixa de texto e clique no botão "Run" (Executar).
-- ========================================================================

-- Tabela de Mapeamentos Fiscais/CRF
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

-- Tabela de Itens de Avaliação
CREATE TABLE IF NOT EXISTS "evaluation_items" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Variáveis de Avaliação
CREATE TABLE IF NOT EXISTS "evaluation_variables" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Variáveis de Template customizadas
CREATE TABLE IF NOT EXISTS "templateVariables" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Texto de Introdução do Relatório
CREATE TABLE IF NOT EXISTS "evaluation_intro" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS "settings" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tabela de Chunks (Pedaços) do arquivo .docx do Template
CREATE TABLE IF NOT EXISTS "settings_chunks" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Desativar RLS para facilitar acessibilidade direta via Chave Anon
ALTER TABLE "fiscal_crf_mappings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "fiscal_name_mappings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "authorized_users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_variables" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "templateVariables" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_intro" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "settings_chunks" DISABLE ROW LEVEL SECURITY;

-- Limpar dados de exemplo de conflitos (opcional)
-- INSERT INTO "authorized_users" (id, data) VALUES ('jeffersonayresjefferson@gmail.com', '{"email": "jeffersonayresjefferson@gmail.com", "role": "admin", "addedBy": "sistema", "createdAt": 1718485299000}') ON CONFLICT (id) DO NOTHING;
