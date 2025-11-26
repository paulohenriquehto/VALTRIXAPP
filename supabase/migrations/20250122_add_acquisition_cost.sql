-- Migration: Adicionar campo de Custo de Aquisição de Cliente (CAC)
-- Data: 2025-01-22
-- Descrição: Adiciona coluna acquisition_cost para rastrear custos de aquisição (tráfego pago, indicações, etc.)

-- Adicionar coluna acquisition_cost à tabela clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS acquisition_cost DECIMAL(10,2) DEFAULT 0;

-- Adicionar comentário explicativo
COMMENT ON COLUMN clients.acquisition_cost IS 'Custo total para adquirir o cliente (tráfego pago, comissão de indicação, etc.). Usado para calcular ROI real.';

-- Criar índice para consultas de ROI
CREATE INDEX IF NOT EXISTS idx_clients_acquisition_cost ON clients(acquisition_cost) WHERE acquisition_cost > 0;
