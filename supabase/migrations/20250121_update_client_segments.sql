-- Migration: Update client segments from industries to services
-- Date: 2025-01-21
-- Description: Muda segmentos de "indústrias" para "serviços oferecidos"

-- IMPORTANTE: Esta migration assume que você ainda não tem dados críticos em produção.
-- Se você já tem clientes cadastrados, ajuste os valores de UPDATE abaixo conforme necessário.

-- 1. Atualizar registros existentes para 'other' antes de alterar o enum
-- (isso evita erros de constraint violation)
UPDATE clients
SET segment = 'other'
WHERE segment IS NOT NULL;

-- 2. Remover o enum antigo
DROP TYPE IF EXISTS client_segment CASCADE;

-- 3. Criar novo enum com serviços
CREATE TYPE client_segment AS ENUM (
  'web_development',
  'software_development',
  'bug_fixing',
  'landing_pages',
  'microsites',
  'web_design',
  'ui_ux_design',
  'traffic_management',
  'seo',
  'consulting',
  'maintenance',
  'other'
);

-- 4. Recriar a coluna segment com o novo tipo
ALTER TABLE clients
ALTER COLUMN segment TYPE client_segment
USING segment::text::client_segment;

-- 5. Adicionar comentário explicativo
COMMENT ON TYPE client_segment IS 'Tipo de serviço oferecido ao cliente (web development, design, SEO, etc.)';
COMMENT ON COLUMN clients.segment IS 'Serviço/projeto contratado pelo cliente';

-- Rollback (se necessário, descomente abaixo):
-- DROP TYPE client_segment CASCADE;
-- CREATE TYPE client_segment AS ENUM ('technology', 'healthcare', 'education', 'finance', 'retail', 'manufacturing', 'services', 'other');
-- ALTER TABLE clients ALTER COLUMN segment TYPE client_segment USING segment::text::client_segment;
