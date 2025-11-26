# Migrations Supabase - VALTRIXAPP

## Como aplicar migrations

### Opção 1: Supabase Dashboard (Recomendado para este projeto)

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione o projeto **VALTRIXAPP** (`niwdggwimhhecplgunjj`)
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo de migration
6. Execute a query (botão **Run** ou `Ctrl+Enter`)

### Opção 2: Supabase CLI (se configurado)

```bash
# Aplicar migration específica
supabase db push

# Ou executar SQL diretamente
supabase db execute --file ./supabase/migrations/20250121_add_client_type_and_completed_status.sql
```

## Migrations disponíveis

### 20250121_add_client_type_and_completed_status.sql
**Status:** ⏳ Pendente de aplicação

**Descrição:** Adiciona suporte para clientes Freelance (serviço único) vs Recorrentes (MRR)

**Alterações:**
- ✅ Cria enum `client_type` ('recurring', 'freelance')
- ✅ Adiciona coluna `client_type` na tabela `clients` (default: 'recurring')
- ✅ Adiciona valor 'completed' ao enum `client_status`
- ✅ Cria índices para otimizar queries por tipo
- ✅ Adiciona comentários de documentação

**Impacto:**
- ✅ Compatível com dados existentes (default 'recurring')
- ✅ Não quebra funcionalidades existentes
- ⚠️ Após aplicar, atualizar tipos TypeScript no frontend (já feito)

## Verificação pós-migration

Após aplicar a migration, execute as seguintes queries para verificar:

```sql
-- Verificar se o enum foi criado
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'client_type'::regtype;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'client_type';

-- Verificar índices criados
SELECT indexname FROM pg_indexes
WHERE tablename = 'clients' AND indexname LIKE 'idx_clients_%';

-- Verificar valores do enum client_status
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'client_status'::regtype;
```

## Histórico de migrations

| Data | Arquivo | Status | Descrição |
|------|---------|--------|-----------|
| 2025-01-21 | `20250121_add_client_type_and_completed_status.sql` | ⏳ Pendente | Adiciona tipos de cliente (Freelance vs Recorrente) |

---

**Nota:** Sempre faça backup do banco antes de aplicar migrations em produção.
