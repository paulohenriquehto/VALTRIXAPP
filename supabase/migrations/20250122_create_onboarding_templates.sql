-- =====================================================
-- Migration: Sistema de Templates de Onboarding
-- Descrição: Cria estrutura para templates de onboarding
--            automático por tipo de serviço
-- Data: 2025-01-22
-- =====================================================

-- =====================================================
-- 1. TABELA: service_templates
-- Descrição: Define templates de serviços disponíveis
-- =====================================================
CREATE TABLE IF NOT EXISTS service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação do template
  name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- Deve coincidir com client_segment
  description TEXT,

  -- Configurações do template
  is_active BOOLEAN DEFAULT true,
  icon VARCHAR(50), -- Nome do ícone (lucide-react)
  color VARCHAR(50), -- Cor theme do template

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_service_type UNIQUE(service_type)
);

-- Índices para performance
CREATE INDEX idx_service_templates_type ON service_templates(service_type);
CREATE INDEX idx_service_templates_active ON service_templates(is_active);

COMMENT ON TABLE service_templates IS 'Templates de serviços para auto-criação de onboarding';
COMMENT ON COLUMN service_templates.service_type IS 'Tipo de serviço (deve corresponder ao client_segment)';

-- =====================================================
-- 2. TABELA: template_projects
-- Descrição: Projetos que compõem cada template
-- =====================================================
CREATE TABLE IF NOT EXISTS template_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento com template de serviço
  service_template_id UUID NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,

  -- Dados do projeto template
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Ordenação e prioridade
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,

  -- Configurações do projeto
  estimated_duration_days INTEGER, -- Duração estimada em dias

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_template_projects_service ON template_projects(service_template_id);
CREATE INDEX idx_template_projects_order ON template_projects(service_template_id, sort_order);

COMMENT ON TABLE template_projects IS 'Projetos que fazem parte de cada template de serviço';
COMMENT ON COLUMN template_projects.sort_order IS 'Ordem de exibição/execução (0 = primeiro)';

-- =====================================================
-- 3. TABELA: template_tasks
-- Descrição: Tarefas que compõem cada projeto template
-- =====================================================
CREATE TABLE IF NOT EXISTS template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento com projeto template
  template_project_id UUID NOT NULL REFERENCES template_projects(id) ON DELETE CASCADE,

  -- Dados da tarefa template
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Ordenação e configurações
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,

  -- Prazo e dependências
  days_after_start INTEGER DEFAULT 0, -- Dias após início do onboarding
  depends_on_task_id UUID REFERENCES template_tasks(id), -- Dependência entre tarefas

  -- Responsável sugerido
  assigned_to_role VARCHAR(50), -- 'client', 'team', 'both'

  -- Categoria da tarefa
  category VARCHAR(100), -- 'setup', 'communication', 'technical', 'review', etc.

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_template_tasks_project ON template_tasks(template_project_id);
CREATE INDEX idx_template_tasks_order ON template_tasks(template_project_id, sort_order);
CREATE INDEX idx_template_tasks_category ON template_tasks(category);
CREATE INDEX idx_template_tasks_dependencies ON template_tasks(depends_on_task_id);

COMMENT ON TABLE template_tasks IS 'Tarefas que fazem parte de cada projeto template';
COMMENT ON COLUMN template_tasks.days_after_start IS 'Quantos dias após início do onboarding esta tarefa deve ter como due_date';
COMMENT ON COLUMN template_tasks.depends_on_task_id IS 'ID de outra tarefa da qual esta depende';
COMMENT ON COLUMN template_tasks.assigned_to_role IS 'Responsável sugerido: client, team ou both';

-- =====================================================
-- 4. TABELA: client_onboarding_status
-- Descrição: Controla status de onboarding de cada cliente
-- =====================================================
CREATE TABLE IF NOT EXISTS client_onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_template_id UUID NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,

  -- Status do onboarding
  status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'paused'
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Datas importantes
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,

  -- Estatísticas
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  pending_tasks INTEGER DEFAULT 0,

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_client_onboarding UNIQUE(client_id, service_template_id)
);

-- Índices para performance
CREATE INDEX idx_onboarding_status_client ON client_onboarding_status(client_id);
CREATE INDEX idx_onboarding_status_template ON client_onboarding_status(service_template_id);
CREATE INDEX idx_onboarding_status_status ON client_onboarding_status(status);

COMMENT ON TABLE client_onboarding_status IS 'Rastreia progresso de onboarding de cada cliente';
COMMENT ON COLUMN client_onboarding_status.status IS 'Status atual: not_started, in_progress, completed, paused';
COMMENT ON COLUMN client_onboarding_status.progress_percentage IS 'Percentual de conclusão (0-100)';

-- =====================================================
-- FUNCTION: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER service_templates_updated_at
  BEFORE UPDATE ON service_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER template_projects_updated_at
  BEFORE UPDATE ON template_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER template_tasks_updated_at
  BEFORE UPDATE ON template_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updated_at();

CREATE TRIGGER client_onboarding_status_updated_at
  BEFORE UPDATE ON client_onboarding_status
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updated_at();

-- =====================================================
-- Mensagem de sucesso
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration concluída: Sistema de Templates de Onboarding criado com sucesso!';
  RAISE NOTICE '- 4 tabelas criadas: service_templates, template_projects, template_tasks, client_onboarding_status';
  RAISE NOTICE '- Índices e constraints aplicados';
  RAISE NOTICE '- Triggers de updated_at configurados';
END $$;
