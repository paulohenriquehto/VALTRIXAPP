-- Migration: Add client_type and completed status
-- Date: 2025-01-21
-- Description: Adiciona suporte para clientes Freelance (serviço único) vs Recorrentes (MRR)

-- 1. Criar enum client_type
CREATE TYPE client_type AS ENUM ('recurring', 'freelance');

-- 2. Adicionar coluna client_type à tabela clients
-- Default 'recurring' para manter compatibilidade com clientes existentes
ALTER TABLE clients
ADD COLUMN client_type client_type NOT NULL DEFAULT 'recurring';

-- 3. Adicionar valor 'completed' ao enum client_status
ALTER TYPE client_status ADD VALUE IF NOT EXISTS 'completed';

-- 4. Criar índice para filtrar por tipo de cliente
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);

-- 5. Criar índice composto para queries comuns (tipo + status)
CREATE INDEX IF NOT EXISTS idx_clients_type_status ON clients(client_type, status);

-- 6. Adicionar comentários para documentação
COMMENT ON COLUMN clients.client_type IS 'Tipo de cliente: recurring (recorrente com MRR) ou freelance (serviço único)';
COMMENT ON TYPE client_type IS 'Define se o cliente é recorrente (MRR) ou freelance (projeto único)';

-- 7. Atualizar comentário do campo monthly_value para refletir novo uso
COMMENT ON COLUMN clients.monthly_value IS 'Valor mensal recorrente (MRR) para clientes recurring, ou valor total do projeto para clientes freelance';

-- Rollback (comentado, descomente para reverter):
-- DROP INDEX IF EXISTS idx_clients_type_status;
-- DROP INDEX IF EXISTS idx_clients_client_type;
-- ALTER TABLE clients DROP COLUMN client_type;
-- DROP TYPE client_type;
-- -- Nota: Não é possível remover valor de enum sem recriar o enum inteiro
