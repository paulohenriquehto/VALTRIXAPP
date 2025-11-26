-- Migration: Add installment fields to payments table
-- Date: 2025-01-21
-- Description: Adiciona suporte para pagamentos parciais (installments) para clientes freelance

-- 1. Adicionar coluna installment_number para numerar parcelas
ALTER TABLE payments
ADD COLUMN installment_number INT NULL;

-- 2. Adicionar coluna percentage para armazenar porcentagem do valor total
ALTER TABLE payments
ADD COLUMN percentage DECIMAL(5,2) NULL;

-- 3. Adicionar constraint para garantir que percentage está entre 0 e 100
ALTER TABLE payments
ADD CONSTRAINT chk_percentage_range CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100));

-- 4. Criar índice para buscar pagamentos de um cliente específico
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);

-- 5. Criar índice para buscar pagamentos por número de parcela
CREATE INDEX IF NOT EXISTS idx_payments_installment ON payments(client_id, installment_number);

-- 6. Adicionar comentários para documentação
COMMENT ON COLUMN payments.installment_number IS 'Número da parcela (1, 2, 3...) para controlar pagamentos parciais';
COMMENT ON COLUMN payments.percentage IS 'Porcentagem do valor total do projeto (0-100) que esta parcela representa';

-- Rollback (se necessário, descomente abaixo):
-- ALTER TABLE payments DROP CONSTRAINT IF EXISTS chk_percentage_range;
-- DROP INDEX IF EXISTS idx_payments_installment;
-- DROP INDEX IF EXISTS idx_payments_client_id;
-- ALTER TABLE payments DROP COLUMN percentage;
-- ALTER TABLE payments DROP COLUMN installment_number;
