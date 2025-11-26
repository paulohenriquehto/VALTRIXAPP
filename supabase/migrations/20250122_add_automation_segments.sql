-- Migration: Adicionar opções de automação ao enum client_segment
-- Data: 2025-01-22
-- Descrição: Adiciona 6 novos tipos de serviço relacionados a automação e IA

-- Adicionar novos valores ao enum client_segment
ALTER TYPE client_segment ADD VALUE IF NOT EXISTS 'chatbot';
ALTER TYPE client_segment ADD VALUE IF NOT EXISTS 'website_automation';
ALTER TYPE client_segment ADD VALUE IF NOT EXISTS 'n8n_automation';
ALTER TYPE client_segment ADD VALUE IF NOT EXISTS 'defy_automation';
ALTER TYPE client_segment ADD VALUE IF NOT EXISTS 'agno_automation';
ALTER TYPE client_segment ADD VALUE IF NOT EXISTS 'langchain_automation';

-- Comentários explicando cada novo valor
COMMENT ON TYPE client_segment IS 'Tipos de serviços oferecidos aos clientes, incluindo automações e IA';
