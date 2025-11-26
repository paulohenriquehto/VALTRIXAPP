-- =====================================================
-- Migration: Popular Templates Pré-Configurados
-- Descrição: Insere templates padrão de onboarding para
--            os principais tipos de serviço
-- Data: 2025-01-22
-- =====================================================

-- =====================================================
-- TEMPLATE 1: GESTÃO DE TRÁFEGO
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_setup_id UUID;
  v_project_briefing_id UUID;
  v_project_execution_id UUID;
BEGIN
  -- Criar template de serviço
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Gestão de Tráfego',
    'traffic_management',
    'Template de onboarding para serviços de gestão de tráfego pago e mídia digital',
    true,
    'TrendingUp',
    'blue'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Setup Inicial
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Setup Inicial e Configurações',
    'Configuração de contas, acessos e ferramentas necessárias',
    0,
    true,
    3
  ) RETURNING id INTO v_project_setup_id;

  -- Tarefas do Projeto 1
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_setup_id, 'Criar grupo no WhatsApp', 'Criar grupo de comunicação com o cliente', 0, true, 0, 'team', 'communication'),
  (v_project_setup_id, 'Solicitar acessos às contas de anúncios', 'Solicitar acesso admin ao Facebook Ads Manager e Google Ads', 1, true, 0, 'team', 'setup'),
  (v_project_setup_id, 'Configurar Pixel do Facebook', 'Instalar e configurar pixel de rastreamento', 2, true, 1, 'team', 'technical'),
  (v_project_setup_id, 'Configurar Google Tag Manager', 'Implementar GTM e conversões', 3, true, 1, 'team', 'technical'),
  (v_project_setup_id, 'Criar pasta no Google Drive', 'Organizar pasta compartilhada para materiais', 4, true, 0, 'team', 'setup');

  -- PROJETO 2: Briefing e Estratégia
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Briefing e Planejamento Estratégico',
    'Levantamento de informações e definição de estratégia',
    1,
    true,
    5
  ) RETURNING id INTO v_project_briefing_id;

  -- Tarefas do Projeto 2
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_briefing_id, 'Enviar formulário de briefing', 'Coletar informações sobre público, objetivos e histórico', 0, true, 2, 'team', 'communication'),
  (v_project_briefing_id, 'Cliente preencher briefing', 'Cliente responde formulário com informações estratégicas', 1, true, 4, 'client', 'communication'),
  (v_project_briefing_id, 'Analisar concorrentes', 'Pesquisar e analisar estratégias da concorrência', 2, true, 5, 'team', 'review'),
  (v_project_briefing_id, 'Definir personas e público-alvo', 'Documentar perfil do cliente ideal (ICP)', 3, true, 6, 'team', 'setup'),
  (v_project_briefing_id, 'Apresentar proposta de estratégia', 'Reunião para alinhar estratégia de tráfego', 4, true, 7, 'both', 'communication');

  -- PROJETO 3: Execução e Lançamento
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '3. Execução e Lançamento de Campanhas',
    'Criação e lançamento das primeiras campanhas',
    2,
    true,
    7
  ) RETURNING id INTO v_project_execution_id;

  -- Tarefas do Projeto 3
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_execution_id, 'Criar copies para anúncios', 'Desenvolver textos persuasivos para campanhas', 0, true, 8, 'team', 'setup'),
  (v_project_execution_id, 'Solicitar materiais criativos', 'Pedir imagens, vídeos e artes ao cliente', 1, true, 8, 'team', 'communication'),
  (v_project_execution_id, 'Aprovar criativos com cliente', 'Validar artes e copies antes do lançamento', 2, true, 10, 'both', 'review'),
  (v_project_execution_id, 'Configurar campanhas nas plataformas', 'Criar estrutura de campanhas no Facebook/Google Ads', 3, true, 12, 'team', 'technical'),
  (v_project_execution_id, 'Lançar primeiras campanhas', 'Ativar campanhas e iniciar veiculação', 4, true, 14, 'team', 'setup'),
  (v_project_execution_id, 'Configurar relatórios automatizados', 'Criar dashboards de acompanhamento (Looker Studio)', 5, true, 15, 'team', 'technical');

  RAISE NOTICE '✅ Template "Gestão de Tráfego" criado com sucesso!';
END $$;

-- =====================================================
-- TEMPLATE 2: DESENVOLVIMENTO DE SITE
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_discovery_id UUID;
  v_project_design_id UUID;
  v_project_dev_id UUID;
BEGIN
  -- Criar template de serviço
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Desenvolvimento de Site',
    'web_development',
    'Template de onboarding para projetos de desenvolvimento web',
    true,
    'Code',
    'purple'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Discovery e Planejamento
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Discovery e Planejamento',
    'Levantamento de requisitos e definição de escopo',
    0,
    true,
    5
  ) RETURNING id INTO v_project_discovery_id;

  -- Tarefas do Projeto 1
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_discovery_id, 'Criar grupo no WhatsApp', 'Criar canal de comunicação com o cliente', 0, true, 0, 'team', 'communication'),
  (v_project_discovery_id, 'Enviar briefing de projeto', 'Formulário para coletar requisitos e expectativas', 1, true, 0, 'team', 'communication'),
  (v_project_discovery_id, 'Cliente preencher briefing', 'Cliente responde com objetivos, funcionalidades e referências', 2, true, 2, 'client', 'communication'),
  (v_project_discovery_id, 'Analisar referências e concorrentes', 'Pesquisar sites similares e melhores práticas', 3, true, 3, 'team', 'review'),
  (v_project_discovery_id, 'Definir arquitetura de informação', 'Estruturar mapa do site e navegação', 4, true, 4, 'team', 'setup'),
  (v_project_discovery_id, 'Criar pasta no Google Drive', 'Organizar repositório de arquivos do projeto', 5, true, 0, 'team', 'setup');

  -- PROJETO 2: Design e Prototipação
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Design e Prototipação',
    'Criação de wireframes, protótipos e design visual',
    1,
    true,
    10
  ) RETURNING id INTO v_project_design_id;

  -- Tarefas do Projeto 2
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_design_id, 'Criar wireframes de baixa fidelidade', 'Esboços iniciais da estrutura das páginas', 0, true, 5, 'team', 'setup'),
  (v_project_design_id, 'Aprovar wireframes com cliente', 'Validar estrutura antes de avançar para design', 1, true, 7, 'both', 'review'),
  (v_project_design_id, 'Desenvolver identidade visual', 'Definir paleta de cores, tipografia e elementos visuais', 2, true, 8, 'team', 'setup'),
  (v_project_design_id, 'Criar protótipo de alta fidelidade', 'Design completo no Figma com interações', 3, true, 12, 'team', 'setup'),
  (v_project_design_id, 'Apresentar protótipo ao cliente', 'Reunião de validação do design', 4, true, 14, 'both', 'review'),
  (v_project_design_id, 'Solicitar materiais finais', 'Logotipos, imagens e textos definitivos', 5, true, 15, 'team', 'communication');

  -- PROJETO 3: Desenvolvimento
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '3. Desenvolvimento e Deploy',
    'Codificação, testes e publicação do site',
    2,
    true,
    15
  ) RETURNING id INTO v_project_dev_id;

  -- Tarefas do Projeto 3
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_dev_id, 'Configurar ambiente de desenvolvimento', 'Setup de repositório Git e ambiente local', 0, true, 16, 'team', 'technical'),
  (v_project_dev_id, 'Desenvolver estrutura HTML/CSS', 'Implementar layout responsivo', 1, true, 18, 'team', 'technical'),
  (v_project_dev_id, 'Implementar funcionalidades (JavaScript)', 'Adicionar interatividade e animações', 2, true, 21, 'team', 'technical'),
  (v_project_dev_id, 'Integrar com backend/CMS (se aplicável)', 'Conectar formulários, banco de dados, etc', 3, false, 24, 'team', 'technical'),
  (v_project_dev_id, 'Realizar testes de responsividade', 'Validar em diferentes dispositivos e navegadores', 4, true, 27, 'team', 'review'),
  (v_project_dev_id, 'Cliente testar versão de homologação', 'Cliente valida funcionalidades em ambiente de testes', 5, true, 28, 'client', 'review'),
  (v_project_dev_id, 'Configurar domínio e hospedagem', 'Setup de DNS, SSL e servidor', 6, true, 29, 'team', 'technical'),
  (v_project_dev_id, 'Fazer deploy para produção', 'Publicar site no ar', 7, true, 30, 'team', 'technical'),
  (v_project_dev_id, 'Treinamento do cliente (se CMS)', 'Ensinar cliente a gerenciar conteúdo', 8, false, 31, 'both', 'communication');

  RAISE NOTICE '✅ Template "Desenvolvimento de Site" criado com sucesso!';
END $$;

-- =====================================================
-- TEMPLATE 3: DESENVOLVIMENTO DE SOFTWARE
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_requirements_id UUID;
  v_project_mvp_id UUID;
BEGIN
  -- Criar template de serviço
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Desenvolvimento de Software',
    'software_development',
    'Template de onboarding para projetos de software e microsistemas',
    true,
    'Layers',
    'green'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Levantamento de Requisitos
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Levantamento de Requisitos e Documentação',
    'Análise de necessidades e documentação técnica',
    0,
    true,
    7
  ) RETURNING id INTO v_project_requirements_id;

  -- Tarefas do Projeto 1
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_requirements_id, 'Criar grupo no WhatsApp', 'Canal de comunicação com cliente', 0, true, 0, 'team', 'communication'),
  (v_project_requirements_id, 'Realizar reunião de kickoff', 'Entender contexto e necessidades do negócio', 1, true, 1, 'both', 'communication'),
  (v_project_requirements_id, 'Documentar requisitos funcionais', 'Listar todas as funcionalidades necessárias', 2, true, 3, 'team', 'setup'),
  (v_project_requirements_id, 'Documentar requisitos não-funcionais', 'Performance, segurança, escalabilidade', 3, true, 4, 'team', 'setup'),
  (v_project_requirements_id, 'Criar casos de uso', 'Fluxos de interação dos usuários', 4, true, 5, 'team', 'setup'),
  (v_project_requirements_id, 'Definir stack tecnológico', 'Escolher linguagens, frameworks e ferramentas', 5, true, 6, 'team', 'technical'),
  (v_project_requirements_id, 'Criar diagrama de arquitetura', 'Modelar estrutura do sistema', 6, true, 7, 'team', 'technical'),
  (v_project_requirements_id, 'Aprovar documentação com cliente', 'Validar especificações antes de iniciar desenvolvimento', 7, true, 7, 'both', 'review');

  -- PROJETO 2: Desenvolvimento do MVP
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Desenvolvimento do MVP',
    'Implementação da primeira versão funcional',
    1,
    true,
    20
  ) RETURNING id INTO v_project_mvp_id;

  -- Tarefas do Projeto 2
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_mvp_id, 'Configurar repositório Git', 'Setup de controle de versão e branches', 0, true, 8, 'team', 'technical'),
  (v_project_mvp_id, 'Configurar CI/CD', 'Automação de testes e deploy', 1, true, 8, 'team', 'technical'),
  (v_project_mvp_id, 'Criar banco de dados', 'Modelagem e implementação do schema', 2, true, 10, 'team', 'technical'),
  (v_project_mvp_id, 'Desenvolver backend/API', 'Implementar lógica de negócio e endpoints', 3, true, 15, 'team', 'technical'),
  (v_project_mvp_id, 'Desenvolver frontend', 'Criar interfaces de usuário', 4, true, 20, 'team', 'technical'),
  (v_project_mvp_id, 'Implementar autenticação', 'Sistema de login e permissões', 5, true, 22, 'team', 'technical'),
  (v_project_mvp_id, 'Realizar testes unitários', 'Garantir qualidade do código', 6, true, 25, 'team', 'review'),
  (v_project_mvp_id, 'Cliente testar MVP', 'Validação funcional pelo cliente', 7, true, 27, 'client', 'review'),
  (v_project_mvp_id, 'Deploy em produção', 'Publicar primeira versão', 8, true, 28, 'team', 'technical'),
  (v_project_mvp_id, 'Treinamento de uso do sistema', 'Capacitar usuários finais', 9, true, 30, 'both', 'communication');

  RAISE NOTICE '✅ Template "Desenvolvimento de Software" criado com sucesso!';
END $$;

-- =====================================================
-- TEMPLATE 4: AUTOMAÇÃO COM n8n
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_mapping_id UUID;
  v_project_automation_id UUID;
BEGIN
  -- Criar template de serviço
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Automação com n8n',
    'n8n_automation',
    'Template de onboarding para projetos de automação usando n8n',
    true,
    'Zap',
    'orange'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Mapeamento de Processos
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Mapeamento de Processos e Requisitos',
    'Identificação de fluxos e integrações necessárias',
    0,
    true,
    5
  ) RETURNING id INTO v_project_mapping_id;

  -- Tarefas do Projeto 1
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_mapping_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_mapping_id, 'Reunião de mapeamento de processos', 'Entender fluxo de trabalho atual', 1, true, 1, 'both', 'communication'),
  (v_project_mapping_id, 'Documentar processos manuais', 'Registrar passos que serão automatizados', 2, true, 2, 'team', 'setup'),
  (v_project_mapping_id, 'Identificar ferramentas a integrar', 'Listar APIs e sistemas envolvidos', 3, true, 3, 'both', 'setup'),
  (v_project_mapping_id, 'Solicitar acessos e credenciais', 'API keys, webhooks, autorizações', 4, true, 3, 'team', 'communication'),
  (v_project_mapping_id, 'Definir triggers e ações', 'Mapear eventos que iniciam automações', 5, true, 4, 'team', 'setup'),
  (v_project_mapping_id, 'Aprovar escopo de automação', 'Cliente valida fluxos que serão automatizados', 6, true, 5, 'both', 'review');

  -- PROJETO 2: Desenvolvimento da Automação
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Desenvolvimento e Testes de Automação',
    'Configuração do n8n e implementação dos workflows',
    1,
    true,
    10
  ) RETURNING id INTO v_project_automation_id;

  -- Tarefas do Projeto 2
  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_automation_id, 'Configurar ambiente n8n', 'Instalar e configurar instância do n8n', 0, true, 6, 'team', 'technical'),
  (v_project_automation_id, 'Criar workflows no n8n', 'Implementar automações conforme mapeamento', 1, true, 8, 'team', 'technical'),
  (v_project_automation_id, 'Configurar integrações com APIs', 'Conectar ferramentas externas', 2, true, 10, 'team', 'technical'),
  (v_project_automation_id, 'Implementar tratamento de erros', 'Adicionar fallbacks e notificações de falha', 3, true, 12, 'team', 'technical'),
  (v_project_automation_id, 'Testar workflows em ambiente de testes', 'Validar funcionamento sem impacto em produção', 4, true, 13, 'team', 'review'),
  (v_project_automation_id, 'Cliente testar automação', 'Cliente valida resultados em ambiente controlado', 5, true, 14, 'client', 'review'),
  (v_project_automation_id, 'Ativar automação em produção', 'Colocar workflows no ar', 6, true, 15, 'team', 'technical'),
  (v_project_automation_id, 'Configurar monitoramento', 'Alertas e logs de execução', 7, true, 15, 'team', 'technical'),
  (v_project_automation_id, 'Treinamento de uso', 'Ensinar cliente a acompanhar e ajustar automações', 8, true, 16, 'both', 'communication'),
  (v_project_automation_id, 'Documentar workflows', 'Criar guia de como funciona cada automação', 9, true, 16, 'team', 'setup');

  RAISE NOTICE '✅ Template "Automação com n8n" criado com sucesso!';
END $$;

-- =====================================================
-- Mensagem de sucesso final
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Migration concluída: Templates pré-configurados criados!';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Templates disponíveis:';
  RAISE NOTICE '1. ✅ Gestão de Tráfego (traffic_management)';
  RAISE NOTICE '2. ✅ Desenvolvimento de Site (web_development)';
  RAISE NOTICE '3. ✅ Desenvolvimento de Software (software_development)';
  RAISE NOTICE '4. ✅ Automação com n8n (n8n_automation)';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Total: 4 templates, ~12 projetos, ~70+ tarefas';
  RAISE NOTICE 'Sistema de onboarding pronto para uso!';
  RAISE NOTICE '=======================================================';
END $$;
