-- =====================================================
-- Migration: Popular Templates Restantes
-- Descrição: Insere templates de onboarding para os
--            14 tipos de serviço restantes
-- Data: 2025-01-23
-- =====================================================

-- =====================================================
-- TEMPLATE 5: CORREÇÃO DE BUGS
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_diagnosis_id UUID;
  v_project_fix_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Correção de Bugs',
    'bug_fixing',
    'Template de onboarding para serviços de correção de bugs e troubleshooting',
    true,
    'Bug',
    'red'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Diagnóstico
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Diagnóstico e Análise',
    'Identificação e reprodução do problema',
    0,
    true,
    2
  ) RETURNING id INTO v_project_diagnosis_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_diagnosis_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_diagnosis_id, 'Coletar informações do bug', 'Descrição, prints, logs, ambiente', 1, true, 0, 'team', 'communication'),
  (v_project_diagnosis_id, 'Reproduzir o problema', 'Validar cenário de erro', 2, true, 1, 'team', 'technical'),
  (v_project_diagnosis_id, 'Analisar logs e stack trace', 'Investigar causa raiz', 3, true, 1, 'team', 'review'),
  (v_project_diagnosis_id, 'Documentar causa do bug', 'Explicar origem do problema', 4, true, 2, 'team', 'setup');

  -- PROJETO 2: Correção e Testes
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Correção e Validação',
    'Implementação da correção e testes',
    1,
    true,
    3
  ) RETURNING id INTO v_project_fix_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_fix_id, 'Implementar correção', 'Corrigir código problemático', 0, true, 3, 'team', 'technical'),
  (v_project_fix_id, 'Criar testes automatizados', 'Garantir que bug não volte', 1, true, 4, 'team', 'technical'),
  (v_project_fix_id, 'Testar em ambiente de homologação', 'Validar correção', 2, true, 4, 'team', 'review'),
  (v_project_fix_id, 'Cliente validar correção', 'Cliente confirma que problema foi resolvido', 3, true, 5, 'client', 'review'),
  (v_project_fix_id, 'Deploy em produção', 'Aplicar correção no ambiente final', 4, true, 5, 'team', 'technical');

  RAISE NOTICE '✅ Template "Correção de Bugs" criado!';
END $$;

-- =====================================================
-- TEMPLATE 6: LANDING PAGES
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_briefing_id UUID;
  v_project_design_id UUID;
  v_project_dev_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Landing Pages',
    'landing_pages',
    'Template de onboarding para criação de landing pages de conversão',
    true,
    'FileText',
    'yellow'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Briefing
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Briefing e Estratégia',
    'Definição de objetivo e público-alvo',
    0,
    true,
    2
  ) RETURNING id INTO v_project_briefing_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_briefing_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_briefing_id, 'Definir objetivo da landing page', 'Captura de leads, vendas, cadastros, etc', 1, true, 0, 'both', 'setup'),
  (v_project_briefing_id, 'Identificar público-alvo', 'Persona e segmento', 2, true, 1, 'both', 'setup'),
  (v_project_briefing_id, 'Coletar referências', 'Exemplos de páginas inspiradoras', 3, true, 1, 'client', 'communication'),
  (v_project_briefing_id, 'Definir estrutura de conteúdo', 'Seções, CTA, formulários', 4, true, 2, 'team', 'setup');

  -- PROJETO 2: Design
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Design e Copy',
    'Criação visual e textos persuasivos',
    1,
    true,
    4
  ) RETURNING id INTO v_project_design_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_design_id, 'Criar copywriting', 'Textos persuasivos e CTAs', 0, true, 3, 'team', 'setup'),
  (v_project_design_id, 'Desenvolver layout no Figma', 'Design visual completo', 1, true, 4, 'team', 'setup'),
  (v_project_design_id, 'Aprovar design com cliente', 'Validação visual', 2, true, 5, 'both', 'review'),
  (v_project_design_id, 'Solicitar imagens e logos', 'Materiais finais do cliente', 3, true, 5, 'team', 'communication');

  -- PROJETO 3: Desenvolvimento
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '3. Desenvolvimento e Publicação',
    'Codificação e deploy da landing page',
    2,
    true,
    3
  ) RETURNING id INTO v_project_dev_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_dev_id, 'Desenvolver HTML/CSS responsivo', 'Implementar layout', 0, true, 6, 'team', 'technical'),
  (v_project_dev_id, 'Integrar formulários', 'Captura de leads com validação', 1, true, 7, 'team', 'technical'),
  (v_project_dev_id, 'Configurar tracking (GA, Pixel)', 'Analytics e conversões', 2, true, 7, 'team', 'technical'),
  (v_project_dev_id, 'Otimizar SEO e performance', 'Meta tags, velocidade', 3, true, 8, 'team', 'technical'),
  (v_project_dev_id, 'Cliente testar página', 'Validação funcional', 4, true, 8, 'client', 'review'),
  (v_project_dev_id, 'Publicar landing page', 'Deploy final', 5, true, 9, 'team', 'technical');

  RAISE NOTICE '✅ Template "Landing Pages" criado!';
END $$;

-- =====================================================
-- TEMPLATE 7: MICROSITES
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_planning_id UUID;
  v_project_dev_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Microsites',
    'microsites',
    'Template de onboarding para criação de microsites e mini portais',
    true,
    'Globe',
    'cyan'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Planejamento
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Planejamento e Estrutura',
    'Definição de escopo e arquitetura',
    0,
    true,
    3
  ) RETURNING id INTO v_project_planning_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_planning_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_planning_id, 'Definir objetivo do microsite', 'Campanha, evento, produto específico', 1, true, 0, 'both', 'setup'),
  (v_project_planning_id, 'Mapear páginas necessárias', 'Home, sobre, contato, etc', 2, true, 1, 'team', 'setup'),
  (v_project_planning_id, 'Criar wireframes', 'Estrutura visual básica', 3, true, 2, 'team', 'setup'),
  (v_project_planning_id, 'Aprovar estrutura', 'Cliente valida páginas e fluxos', 4, true, 3, 'both', 'review');

  -- PROJETO 2: Desenvolvimento
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Design e Desenvolvimento',
    'Criação visual e implementação',
    1,
    true,
    7
  ) RETURNING id INTO v_project_dev_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_dev_id, 'Criar design visual', 'Layouts no Figma', 0, true, 4, 'team', 'setup'),
  (v_project_dev_id, 'Aprovar design', 'Cliente valida visual', 1, true, 5, 'both', 'review'),
  (v_project_dev_id, 'Desenvolver páginas', 'HTML/CSS/JS responsivo', 2, true, 7, 'team', 'technical'),
  (v_project_dev_id, 'Implementar animações', 'Interatividade e efeitos', 3, false, 8, 'team', 'technical'),
  (v_project_dev_id, 'Cliente testar microsite', 'Validação funcional', 4, true, 9, 'client', 'review'),
  (v_project_dev_id, 'Configurar domínio', 'DNS e hospedagem', 5, true, 9, 'team', 'technical'),
  (v_project_dev_id, 'Publicar microsite', 'Deploy final', 6, true, 10, 'team', 'technical');

  RAISE NOTICE '✅ Template "Microsites" criado!';
END $$;

-- =====================================================
-- TEMPLATE 8: WEB DESIGN
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_briefing_id UUID;
  v_project_creation_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'Web Design',
    'web_design',
    'Template de onboarding para serviços de design visual web',
    true,
    'Palette',
    'pink'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Briefing
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. Briefing Criativo',
    'Levantamento de referências e identidade',
    0,
    true,
    3
  ) RETURNING id INTO v_project_briefing_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_briefing_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_briefing_id, 'Enviar formulário de briefing', 'Coletar preferências e objetivos', 1, true, 0, 'team', 'communication'),
  (v_project_briefing_id, 'Cliente preencher briefing', 'Referências, cores, estilo desejado', 2, true, 1, 'client', 'communication'),
  (v_project_briefing_id, 'Criar moodboard', 'Painel de inspiração visual', 3, true, 2, 'team', 'setup'),
  (v_project_briefing_id, 'Aprovar direção criativa', 'Cliente valida conceito', 4, true, 3, 'both', 'review');

  -- PROJETO 2: Criação
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. Criação e Entrega',
    'Desenvolvimento visual e finalizações',
    1,
    true,
    7
  ) RETURNING id INTO v_project_creation_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_creation_id, 'Criar design de alta fidelidade', 'Layouts completos no Figma', 0, true, 4, 'team', 'setup'),
  (v_project_creation_id, 'Primeira revisão com cliente', 'Ajustes iniciais', 1, true, 6, 'both', 'review'),
  (v_project_creation_id, 'Refinar design', 'Aplicar feedbacks', 2, true, 7, 'team', 'setup'),
  (v_project_creation_id, 'Aprovação final', 'Cliente aprova design', 3, true, 8, 'both', 'review'),
  (v_project_creation_id, 'Preparar arquivos para dev', 'Exportar assets, guia de estilo', 4, true, 9, 'team', 'setup'),
  (v_project_creation_id, 'Entregar design final', 'Arquivos Figma e exports', 5, true, 10, 'team', 'communication');

  RAISE NOTICE '✅ Template "Web Design" criado!';
END $$;

-- =====================================================
-- TEMPLATE 9: UI/UX DESIGN
-- =====================================================
DO $$
DECLARE
  v_template_id UUID;
  v_project_research_id UUID;
  v_project_design_id UUID;
BEGIN
  INSERT INTO service_templates (id, name, service_type, description, is_active, icon, color)
  VALUES (
    gen_random_uuid(),
    'UI/UX Design',
    'ui_ux_design',
    'Template de onboarding para projetos de UI/UX Design',
    true,
    'Figma',
    'indigo'
  ) RETURNING id INTO v_template_id;

  -- PROJETO 1: Research
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '1. UX Research e Discovery',
    'Pesquisa de usuários e análise',
    0,
    true,
    5
  ) RETURNING id INTO v_project_research_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_research_id, 'Criar grupo no WhatsApp', 'Canal de comunicação', 0, true, 0, 'team', 'communication'),
  (v_project_research_id, 'Realizar entrevistas com stakeholders', 'Entender objetivos de negócio', 1, true, 1, 'both', 'communication'),
  (v_project_research_id, 'Definir personas', 'Perfil de usuários-alvo', 2, true, 2, 'team', 'setup'),
  (v_project_research_id, 'Mapear jornada do usuário', 'User journey map', 3, true, 3, 'team', 'setup'),
  (v_project_research_id, 'Analisar concorrentes', 'Benchmarking de UX', 4, true, 4, 'team', 'review'),
  (v_project_research_id, 'Criar arquitetura de informação', 'Estrutura e fluxos', 5, true, 5, 'team', 'setup');

  -- PROJETO 2: Design
  INSERT INTO template_projects (id, service_template_id, name, description, sort_order, is_required, estimated_duration_days)
  VALUES (
    gen_random_uuid(),
    v_template_id,
    '2. UI Design e Protótipo',
    'Wireframes, design system e protótipo',
    1,
    true,
    10
  ) RETURNING id INTO v_project_design_id;

  INSERT INTO template_tasks (template_project_id, title, description, sort_order, is_required, days_after_start, assigned_to_role, category) VALUES
  (v_project_design_id, 'Criar wireframes de baixa fidelidade', 'Estrutura básica', 0, true, 6, 'team', 'setup'),
  (v_project_design_id, 'Aprovar wireframes', 'Cliente valida fluxos', 1, true, 7, 'both', 'review'),
  (v_project_design_id, 'Desenvolver design system', 'Componentes, cores, tipografia', 2, true, 9, 'team', 'setup'),
  (v_project_design_id, 'Criar protótipo de alta fidelidade', 'Design completo interativo', 3, true, 12, 'team', 'setup'),
  (v_project_design_id, 'Testes de usabilidade', 'Validar com usuários reais', 4, false, 14, 'team', 'review'),
  (v_project_design_id, 'Apresentar design final', 'Reunião de entrega', 5, true, 15, 'both', 'communication');

  RAISE NOTICE '✅ Template "UI/UX Design" criado!';
END $$;

-- Continua na próxima parte...
RAISE NOTICE '🔄 Parte 1/2 concluída. Continue executando a próxima migration...';
