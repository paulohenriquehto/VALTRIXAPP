-- =====================================================
-- Migration: Popular Templates Restantes - Parte 2
-- Descrição: Continua inserção dos templates de onboarding
-- Data: 2025-01-23
-- =====================================================

-- =====================================================
-- TEMPLATE 10: CHATBOT
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_flows_id UUID;
  v_project_setup_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Chatbot',
    'chatbot',
    'Template de onboarding para criação e configuração de chatbots',
    true,
    'MessageCircle',
    'teal'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Fluxos
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Mapeamento de Fluxos',
    'Definição de conversas e respostas',
    0,
    true,
    4
  ) RETURNING id INTO v_project_flows_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_flows_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_flows_id, 'Definir objetivos do chatbot', 'Atendimento, vendas, suporte, etc', 1, true, 0, 'both', 'setup'),
  (v_project_flows_id, 'Mapear perguntas frequentes', 'Listar FAQs principais', 2, true, 1, 'both', 'setup'),
  (v_project_flows_id, 'Criar fluxograma de conversas', 'Árvore de decisão', 3, true, 2, 'team', 'setup'),
  (v_project_flows_id, 'Aprovar fluxos', 'Cliente valida estrutura', 4, true, 3, 'both', 'review'),
  (v_project_flows_id, 'Escrever respostas e textos', 'Copy para todas as interações', 5, true, 4, 'team', 'setup');

  -- PROJETO 2: Configuração
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Configuração e Treinamento',
    'Implementação e testes do chatbot',
    1,
    true,
    5
  ) RETURNING id INTO v_project_setup_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_setup_id, 'Configurar plataforma', 'Setup no Manychat/Dialogflow/etc', 0, true, 5, 'team', 'technical'),
  (v_project_setup_id, 'Implementar fluxos', 'Criar conversas na plataforma', 1, true, 6, 'team', 'technical'),
  (v_project_setup_id, 'Configurar integrações', 'CRM, WhatsApp, Messenger, etc', 2, true, 7, 'team', 'technical'),
  (v_project_setup_id, 'Treinar IA (se aplicável)', 'Machine learning com exemplos', 3, false, 8, 'team', 'technical'),
  (v_project_setup_id, 'Testar chatbot', 'Validação de todos os fluxos', 4, true, 8, 'team', 'review'),
  (v_project_setup_id, 'Cliente testar chatbot', 'Cliente valida funcionalidade', 5, true, 9, 'client', 'review'),
  (v_project_setup_id, 'Ativar em produção', 'Publicar chatbot', 6, true, 9, 'team', 'technical'),
  (v_project_setup_id, 'Treinamento de uso', 'Ensinar cliente a gerenciar', 7, true, 10, 'both', 'communication');

  RAISE NOTICE '✅ Template "Chatbot" criado!';
END $$;

-- =====================================================
-- TEMPLATE 11: AUTOMAÇÃO DE SITES
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_mapping_id UUID;
  v_project_automation_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Automação de Sites',
    'website_automation',
    'Template de onboarding para automações web (scraping, bots, integrações)',
    true,
    'Bot',
    'lime'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Mapeamento
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Mapeamento de Processos',
    'Identificação de tarefas a automatizar',
    0,
    true,
    3
  ) RETURNING id INTO v_project_mapping_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_mapping_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_mapping_id, 'Mapear processos manuais', 'Documentar workflow atual', 1, true, 0, 'both', 'setup'),
  (v_project_mapping_id, 'Identificar sites-alvo', 'URLs e páginas a automatizar', 2, true, 1, 'both', 'setup'),
  (v_project_mapping_id, 'Definir ações desejadas', 'Scraping, preenchimento, clicks, etc', 3, true, 2, 'both', 'setup'),
  (v_project_mapping_id, 'Aprovar escopo', 'Cliente valida automações', 4, true, 3, 'both', 'review');

  -- PROJETO 2: Desenvolvimento
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Desenvolvimento da Automação',
    'Implementação e testes',
    1,
    true,
    7
  ) RETURNING id INTO v_project_automation_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_automation_id, 'Desenvolver script de automação', 'Python/Selenium/Puppeteer', 0, true, 4, 'team', 'technical'),
  (v_project_automation_id, 'Implementar tratamento de erros', 'Fallbacks e logging', 1, true, 6, 'team', 'technical'),
  (v_project_automation_id, 'Configurar agendamento', 'Cron jobs ou schedulers', 2, true, 7, 'team', 'technical'),
  (v_project_automation_id, 'Testar automação', 'Validação em diferentes cenários', 3, true, 8, 'team', 'review'),
  (v_project_automation_id, 'Cliente validar resultados', 'Cliente confirma dados extraídos/ações', 4, true, 9, 'client', 'review'),
  (v_project_automation_id, 'Deploy em produção', 'Ativar automação', 5, true, 10, 'team', 'technical'),
  (v_project_automation_id, 'Documentar automação', 'Guia de uso e manutenção', 6, true, 10, 'team', 'setup');

  RAISE NOTICE '✅ Template "Automação de Sites" criado!';
END $$;

-- =====================================================
-- TEMPLATE 12: AUTOMAÇÃO DEFY
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_setup_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Automação DeFy',
    'defy_automation',
    'Template de onboarding para automações com plataforma DeFy',
    true,
    'Zap',
    'violet'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Setup
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Setup e Configuração',
    'Configuração da plataforma DeFy',
    0,
    true,
    7
  ) RETURNING id INTO v_project_setup_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_setup_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_setup_id, 'Mapear processos a automatizar', 'Identificar workflows', 1, true, 0, 'both', 'setup'),
  (v_project_setup_id, 'Configurar conta DeFy', 'Setup inicial da plataforma', 2, true, 1, 'team', 'technical'),
  (v_project_setup_id, 'Criar workflows no DeFy', 'Implementar automações', 3, true, 3, 'team', 'technical'),
  (v_project_setup_id, 'Configurar integrações', 'Conectar APIs e serviços', 4, true, 5, 'team', 'technical'),
  (v_project_setup_id, 'Testar automações', 'Validação funcional', 5, true, 6, 'team', 'review'),
  (v_project_setup_id, 'Cliente testar', 'Cliente valida resultados', 6, true, 7, 'client', 'review'),
  (v_project_setup_id, 'Ativar em produção', 'Deploy final', 7, true, 7, 'team', 'technical');

  RAISE NOTICE '✅ Template "Automação DeFy" criado!';
END $$;

-- =====================================================
-- TEMPLATE 13: AUTOMAÇÃO AGNO
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_integration_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Automação agno',
    'agno_automation',
    'Template de onboarding para automações com agno',
    true,
    'Zap',
    'emerald'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Integração
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Integração e Setup agno',
    'Configuração da plataforma agno',
    0,
    true,
    6
  ) RETURNING id INTO v_project_integration_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_integration_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_integration_id, 'Definir objetivos de automação', 'Mapear necessidades', 1, true, 0, 'both', 'setup'),
  (v_project_integration_id, 'Configurar conta agno', 'Setup inicial', 2, true, 1, 'team', 'technical'),
  (v_project_integration_id, 'Criar fluxos de automação', 'Implementar workflows', 3, true, 2, 'team', 'technical'),
  (v_project_integration_id, 'Conectar serviços externos', 'Integrações via API', 4, true, 4, 'team', 'technical'),
  (v_project_integration_id, 'Testar automações', 'Validação completa', 5, true, 5, 'team', 'review'),
  (v_project_integration_id, 'Ativar em produção', 'Deploy final', 6, true, 6, 'team', 'technical'),
  (v_project_integration_id, 'Treinamento do cliente', 'Ensinar uso da plataforma', 7, true, 6, 'both', 'communication');

  RAISE NOTICE '✅ Template "Automação agno" criado!';
END $$;

-- =====================================================
-- TEMPLATE 14: AUTOMAÇÃO LANGCHAIN
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_setup_id UUID;
  v_project_chains_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Automação LangChain',
    'langchain_automation',
    'Template de onboarding para automações com LangChain (IA/LLM)',
    true,
    'Brain',
    'purple'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Setup
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Setup e Infraestrutura',
    'Configuração de ambiente LangChain',
    0,
    true,
    4
  ) RETURNING id INTO v_project_setup_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_setup_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_setup_id, 'Definir caso de uso de IA', 'Chatbot, análise, geração de conteúdo, etc', 1, true, 0, 'both', 'setup'),
  (v_project_setup_id, 'Configurar ambiente Python', 'Setup de dependências LangChain', 2, true, 1, 'team', 'technical'),
  (v_project_setup_id, 'Configurar API keys', 'OpenAI, Anthropic, etc', 3, true, 1, 'team', 'technical'),
  (v_project_setup_id, 'Preparar base de conhecimento', 'Documentos, dados para RAG', 4, true, 2, 'both', 'setup');

  -- PROJETO 2: Chains
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Desenvolvimento de Chains',
    'Implementação de pipelines LangChain',
    1,
    true,
    8
  ) RETURNING id INTO v_project_chains_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_chains_id, 'Criar prompts personalizados', 'Engenharia de prompts', 0, true, 4, 'team', 'setup'),
  (v_project_chains_id, 'Implementar chains LangChain', 'Desenvolver pipelines', 1, true, 5, 'team', 'technical'),
  (v_project_chains_id, 'Configurar embeddings e vectorstore', 'Setup para RAG (se aplicável)', 2, false, 6, 'team', 'technical'),
  (v_project_chains_id, 'Implementar memory/context', 'Gerenciar histórico de conversas', 3, true, 7, 'team', 'technical'),
  (v_project_chains_id, 'Testar precisão das respostas', 'Validar outputs da IA', 4, true, 9, 'team', 'review'),
  (v_project_chains_id, 'Cliente testar automação', 'Cliente valida resultados', 5, true, 10, 'client', 'review'),
  (v_project_chains_id, 'Deploy em produção', 'Publicar API/aplicação', 6, true, 11, 'team', 'technical'),
  (v_project_chains_id, 'Documentar uso', 'Guia de funcionamento e manutenção', 7, true, 12, 'team', 'setup');

  RAISE NOTICE '✅ Template "Automação LangChain" criado!';
END $$;

-- =====================================================
-- TEMPLATE 15: SEO
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_audit_id UUID;
  v_project_optimization_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'SEO',
    'seo',
    'Template de onboarding para serviços de otimização para motores de busca',
    true,
    'Search',
    'sky'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Auditoria
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Auditoria SEO',
    'Análise completa do site e estratégia',
    0,
    true,
    5
  ) RETURNING id INTO v_project_audit_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_audit_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_audit_id, 'Coletar acessos', 'Google Analytics, Search Console, site', 1, true, 0, 'team', 'communication'),
  (v_project_audit_id, 'Realizar auditoria técnica', 'Performance, indexação, erros', 2, true, 1, 'team', 'review'),
  (v_project_audit_id, 'Pesquisa de palavras-chave', 'Identificar termos estratégicos', 3, true, 2, 'team', 'setup'),
  (v_project_audit_id, 'Analisar concorrentes', 'Benchmarking de SEO', 4, true, 3, 'team', 'review'),
  (v_project_audit_id, 'Apresentar relatório de auditoria', 'Diagnóstico completo e recomendações', 5, true, 5, 'both', 'communication');

  -- PROJETO 2: Otimização
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Otimização e Monitoramento',
    'Implementação de melhorias e acompanhamento',
    1,
    true,
    15
  ) RETURNING id INTO v_project_optimization_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_optimization_id, 'Otimizar títulos e meta descriptions', 'On-page SEO', 0, true, 6, 'team', 'technical'),
  (v_project_optimization_id, 'Melhorar estrutura de URLs', 'URLs amigáveis e lógicas', 1, true, 7, 'team', 'technical'),
  (v_project_optimization_id, 'Otimizar velocidade do site', 'PageSpeed, Core Web Vitals', 2, true, 8, 'team', 'technical'),
  (v_project_optimization_id, 'Criar/otimizar conteúdo', 'Blog posts, landing pages', 3, true, 10, 'team', 'setup'),
  (v_project_optimization_id, 'Construir backlinks', 'Estratégia de link building', 4, false, 12, 'team', 'setup'),
  (v_project_optimization_id, 'Configurar monitoramento', 'Dashboards e alertas', 5, true, 15, 'team', 'technical'),
  (v_project_optimization_id, 'Apresentar relatório mensal', 'Resultados e próximos passos', 6, true, 20, 'both', 'communication');

  RAISE NOTICE '✅ Template "SEO" criado!';
END $$;

-- =====================================================
-- TEMPLATE 16: CONSULTORIA
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_diagnosis_id UUID;
  v_project_recommendations_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Consultoria',
    'consulting',
    'Template de onboarding para serviços de consultoria estratégica',
    true,
    'Lightbulb',
    'amber'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Diagnóstico
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Diagnóstico e Análise',
    'Levantamento de situação atual',
    0,
    true,
    7
  ) RETURNING id INTO v_project_diagnosis_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_diagnosis_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_diagnosis_id, 'Reunião de kickoff', 'Entender contexto e desafios', 1, true, 1, 'both', 'communication'),
  (v_project_diagnosis_id, 'Coletar dados e documentos', 'Processos, relatórios, métricas', 2, true, 2, 'both', 'setup'),
  (v_project_diagnosis_id, 'Realizar entrevistas', 'Stakeholders e equipe', 3, true, 4, 'both', 'communication'),
  (v_project_diagnosis_id, 'Analisar dados coletados', 'Identificar gargalos e oportunidades', 4, true, 6, 'team', 'review'),
  (v_project_diagnosis_id, 'Apresentar diagnóstico', 'Relatório de situação atual', 5, true, 7, 'both', 'communication');

  -- PROJETO 2: Recomendações
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Recomendações e Plano de Ação',
    'Propostas de melhoria e implementação',
    1,
    true,
    10
  ) RETURNING id INTO v_project_recommendations_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_recommendations_id, 'Elaborar recomendações estratégicas', 'Soluções personalizadas', 0, true, 8, 'team', 'setup'),
  (v_project_recommendations_id, 'Criar plano de ação', 'Roadmap de implementação', 1, true, 10, 'team', 'setup'),
  (v_project_recommendations_id, 'Apresentar proposta', 'Reunião de apresentação', 2, true, 12, 'both', 'communication'),
  (v_project_recommendations_id, 'Refinar plano com feedback', 'Ajustes baseados em discussão', 3, true, 13, 'team', 'setup'),
  (v_project_recommendations_id, 'Auxiliar na implementação', 'Suporte durante execução', 4, false, 15, 'both', 'setup'),
  (v_project_recommendations_id, 'Apresentar relatório final', 'Entrega de documentação completa', 5, true, 17, 'both', 'communication');

  RAISE NOTICE '✅ Template "Consultoria" criado!';
END $$;

-- =====================================================
-- TEMPLATE 17: MANUTENÇÃO
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_setup_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Manutenção',
    'maintenance',
    'Template de onboarding para serviços de manutenção contínua',
    true,
    'Wrench',
    'slate'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Setup
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Setup de Manutenção',
    'Configuração de rotinas e acessos',
    0,
    true,
    3
  ) RETURNING id INTO v_project_setup_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_setup_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_setup_id, 'Coletar acessos necessários', 'Servidor, CMS, admin, etc', 1, true, 0, 'team', 'communication'),
  (v_project_setup_id, 'Realizar auditoria inicial', 'Verificar estado atual do site/sistema', 2, true, 1, 'team', 'review'),
  (v_project_setup_id, 'Definir SLA e escopo', 'Acordar prazos de atendimento', 3, true, 2, 'both', 'setup'),
  (v_project_setup_id, 'Configurar monitoramento', 'Uptime, performance, segurança', 4, true, 2, 'team', 'technical'),
  (v_project_setup_id, 'Criar backup automático', 'Rotina de backups regulares', 5, true, 3, 'team', 'technical'),
  (v_project_setup_id, 'Atualizar dependências', 'Plugins, frameworks, bibliotecas', 6, true, 3, 'team', 'technical');

  RAISE NOTICE '✅ Template "Manutenção" criado!';
END $$;

-- =====================================================
-- TEMPLATE 18: OUTROS SERVIÇOS (GENÉRICO)
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_planning_id UUID;
  v_project_execution_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Outros Serviços',
    'other',
    'Template genérico de onboarding para serviços não categorizados',
    true,
    'Package',
    'gray'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Planejamento
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Planejamento e Definição',
    'Entendimento de necessidades e escopo',
    0,
    true,
    3
  ) RETURNING id INTO v_project_planning_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_planning_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_planning_id, 'Reunião de descoberta', 'Entender objetivos e requisitos', 1, true, 0, 'both', 'communication'),
  (v_project_planning_id, 'Documentar escopo', 'Formalizar entregas e prazos', 2, true, 1, 'team', 'setup'),
  (v_project_planning_id, 'Aprovar escopo', 'Cliente valida planejamento', 3, true, 2, 'both', 'review'),
  (v_project_planning_id, 'Criar pasta no Google Drive', 'Organizar materiais do projeto', 4, true, 0, 'team', 'setup');

  -- PROJETO 2: Execução
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Execução e Entrega',
    'Implementação do serviço contratado',
    1,
    true,
    10
  ) RETURNING id INTO v_project_execution_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_execution_id, 'Desenvolver solução', 'Implementar serviço conforme escopo', 0, true, 3, 'team', 'technical'),
  (v_project_execution_id, 'Revisão intermediária', 'Cliente acompanha progresso', 1, true, 7, 'both', 'review'),
  (v_project_execution_id, 'Ajustes conforme feedback', 'Refinar entregável', 2, true, 9, 'team', 'setup'),
  (v_project_execution_id, 'Cliente validar entrega final', 'Aprovação do trabalho', 3, true, 12, 'client', 'review'),
  (v_project_execution_id, 'Entregar documentação', 'Guias e materiais finais', 4, true, 13, 'team', 'communication');

  RAISE NOTICE '✅ Template "Outros Serviços" criado!';
END $$;

-- =====================================================
-- Mensagem de sucesso final
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Migration COMPLETA: Todos os templates criados!';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Templates adicionados nesta migration (Parte 2):';
  RAISE NOTICE '10. ✅ Chatbot (chatbot)';
  RAISE NOTICE '11. ✅ Automação de Sites (website_automation)';
  RAISE NOTICE '12. ✅ Automação DeFy (defy_automation)';
  RAISE NOTICE '13. ✅ Automação agno (agno_automation)';
  RAISE NOTICE '14. ✅ Automação LangChain (langchain_automation)';
  RAISE NOTICE '15. ✅ SEO (seo)';
  RAISE NOTICE '16. ✅ Consultoria (consulting)';
  RAISE NOTICE '17. ✅ Manutenção (maintenance)';
  RAISE NOTICE '18. ✅ Outros Serviços (other)';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'TOTAL: 18 templates ativos cobrindo TODOS os serviços!';
  RAISE NOTICE 'Sistema de onboarding 100% completo!';
  RAISE NOTICE '=======================================================';
END $$;
