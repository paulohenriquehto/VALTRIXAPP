-- =====================================================
-- Migration: Trigger de Auto-Criação de Onboarding
-- Descrição: Cria automaticamente projetos e tarefas
--            de onboarding quando um cliente é cadastrado
-- Data: 2025-01-22
-- =====================================================

-- =====================================================
-- FUNCTION: auto_create_onboarding_for_client
-- Descrição: Cria projetos e tarefas baseados no template
--            do tipo de serviço do cliente
-- =====================================================
CREATE OR REPLACE FUNCTION auto_create_onboarding_for_client()
RETURNS TRIGGER AS $$
DECLARE
  v_service_template_id UUID;
  v_template_project RECORD;
  v_template_task RECORD;
  v_new_project_id UUID;
  v_onboarding_status_id UUID;
  v_total_tasks INTEGER := 0;
  v_project_mapping JSONB := '{}'; -- Map template_project_id -> created_project_id
BEGIN
  -- Log de início
  RAISE NOTICE 'Auto-criação de onboarding iniciada para cliente: % (segment: %)', NEW.name, NEW.client_segment;

  -- 1. Buscar template de serviço baseado no client_segment
  SELECT id INTO v_service_template_id
  FROM service_templates
  WHERE service_type = NEW.client_segment
    AND is_active = true
  LIMIT 1;

  -- Se não encontrar template ativo para este serviço, não fazer nada
  IF v_service_template_id IS NULL THEN
    RAISE NOTICE 'Nenhum template ativo encontrado para o serviço: %. Onboarding não será criado automaticamente.', NEW.client_segment;
    RETURN NEW;
  END IF;

  RAISE NOTICE 'Template encontrado: %', v_service_template_id;

  -- 2. Criar registro de status de onboarding
  INSERT INTO client_onboarding_status (
    client_id,
    service_template_id,
    status,
    progress_percentage,
    started_at
  ) VALUES (
    NEW.id,
    v_service_template_id,
    'in_progress',
    0,
    NOW()
  ) RETURNING id INTO v_onboarding_status_id;

  RAISE NOTICE 'Status de onboarding criado: %', v_onboarding_status_id;

  -- 3. Loop pelos projetos do template (ordenados por sort_order)
  FOR v_template_project IN
    SELECT *
    FROM template_projects
    WHERE service_template_id = v_service_template_id
    ORDER BY sort_order ASC
  LOOP
    -- Criar projeto baseado no template
    INSERT INTO projects (
      client_id,
      name,
      description,
      status,
      created_at
    ) VALUES (
      NEW.id,
      v_template_project.name,
      COALESCE(v_template_project.description, 'Projeto de onboarding criado automaticamente'),
      'active',
      NOW()
    ) RETURNING id INTO v_new_project_id;

    RAISE NOTICE 'Projeto criado: % (template: %)', v_new_project_id, v_template_project.id;

    -- Mapear template_project_id -> created_project_id
    v_project_mapping := v_project_mapping || jsonb_build_object(
      v_template_project.id::TEXT, v_new_project_id::TEXT
    );

    -- 4. Loop pelas tarefas deste projeto template (ordenadas por sort_order)
    FOR v_template_task IN
      SELECT *
      FROM template_tasks
      WHERE template_project_id = v_template_project.id
      ORDER BY sort_order ASC
    LOOP
      -- Criar tarefa baseada no template
      INSERT INTO tasks (
        project_id,
        title,
        description,
        completed,
        due_date,
        created_at
      ) VALUES (
        v_new_project_id,
        v_template_task.title,
        COALESCE(v_template_task.description, ''),
        false,
        -- Calcular due_date baseado em days_after_start
        CASE
          WHEN v_template_task.days_after_start IS NOT NULL AND v_template_task.days_after_start > 0
          THEN (CURRENT_DATE + (v_template_task.days_after_start || ' days')::INTERVAL)::DATE
          ELSE NULL
        END,
        NOW()
      );

      -- Incrementar contador de tarefas
      v_total_tasks := v_total_tasks + 1;

      RAISE NOTICE 'Tarefa criada: % (due_date: %d dias)', v_template_task.title, v_template_task.days_after_start;
    END LOOP;
  END LOOP;

  -- 5. Atualizar estatísticas do onboarding_status
  UPDATE client_onboarding_status
  SET
    total_tasks = v_total_tasks,
    pending_tasks = v_total_tasks,
    completed_tasks = 0,
    updated_at = NOW()
  WHERE id = v_onboarding_status_id;

  RAISE NOTICE 'Onboarding criado com sucesso! Total de tarefas: %', v_total_tasks;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, logar mas não bloquear criação do cliente
    RAISE WARNING 'Erro ao criar onboarding automático para cliente %: % - %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: trigger_auto_create_onboarding
-- Descrição: Dispara auto-criação após INSERT de cliente
-- =====================================================
CREATE TRIGGER trigger_auto_create_onboarding
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_onboarding_for_client();

COMMENT ON FUNCTION auto_create_onboarding_for_client() IS 'Cria automaticamente projetos e tarefas de onboarding quando cliente é cadastrado';
COMMENT ON TRIGGER trigger_auto_create_onboarding ON clients IS 'Trigger que executa auto-criação de onboarding após inserção de cliente';

-- =====================================================
-- FUNCTION: update_onboarding_progress
-- Descrição: Atualiza progresso do onboarding quando
--            tarefas são completadas
-- =====================================================
CREATE OR REPLACE FUNCTION update_onboarding_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_pending_tasks INTEGER;
  v_progress_percentage INTEGER;
  v_all_completed BOOLEAN;
BEGIN
  -- Obter client_id do projeto da tarefa
  SELECT client_id INTO v_client_id
  FROM projects
  WHERE id = NEW.project_id;

  -- Contar tarefas do cliente (de todos os projetos de onboarding)
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE completed = true) AS completed,
    COUNT(*) FILTER (WHERE completed = false) AS pending
  INTO v_total_tasks, v_completed_tasks, v_pending_tasks
  FROM tasks t
  INNER JOIN projects p ON t.project_id = p.id
  WHERE p.client_id = v_client_id;

  -- Calcular percentual de progresso
  IF v_total_tasks > 0 THEN
    v_progress_percentage := ROUND((v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100);
  ELSE
    v_progress_percentage := 0;
  END IF;

  -- Verificar se todas as tarefas foram completadas
  v_all_completed := (v_completed_tasks = v_total_tasks AND v_total_tasks > 0);

  -- Atualizar status de onboarding
  UPDATE client_onboarding_status
  SET
    total_tasks = v_total_tasks,
    completed_tasks = v_completed_tasks,
    pending_tasks = v_pending_tasks,
    progress_percentage = v_progress_percentage,
    status = CASE
      WHEN v_all_completed THEN 'completed'
      WHEN v_completed_tasks > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    completed_at = CASE WHEN v_all_completed THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE client_id = v_client_id;

  RAISE NOTICE 'Progresso de onboarding atualizado para cliente %: %% (%/%)', v_client_id, v_progress_percentage, v_completed_tasks, v_total_tasks;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao atualizar progresso de onboarding: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: trigger_update_onboarding_progress
-- Descrição: Atualiza progresso quando tarefa muda
-- =====================================================
CREATE TRIGGER trigger_update_onboarding_progress
  AFTER INSERT OR UPDATE OF completed ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress();

COMMENT ON FUNCTION update_onboarding_progress() IS 'Atualiza estatísticas e progresso de onboarding quando tarefas são alteradas';
COMMENT ON TRIGGER trigger_update_onboarding_progress ON tasks IS 'Trigger que atualiza progresso de onboarding quando tarefas são modificadas';

-- =====================================================
-- Mensagem de sucesso
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Migration concluída: Triggers de Onboarding criados!';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Funcionalidades instaladas:';
  RAISE NOTICE '1. Auto-criação de projetos/tarefas quando cliente é cadastrado';
  RAISE NOTICE '2. Atualização automática de progresso de onboarding';
  RAISE NOTICE '3. Cálculo de due_date baseado em days_after_start';
  RAISE NOTICE '4. Tracking completo de status e estatísticas';
  RAISE NOTICE '=======================================================';
END $$;
