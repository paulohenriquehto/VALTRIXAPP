# PWA - VALTRIXAPP

Este projeto foi transformado em uma Progressive Web App (PWA) completa.

## Funcionalidades PWA

### ✅ Instalável
- Pode ser instalado em desktop e mobile
- Ícones customizados para todas as plataformas
- Manifest configurado com tema e cores da marca

### ✅ Offline First
- Service Worker com estratégias de cache inteligentes
- Funciona mesmo sem conexão à internet
- Fila de operações offline com sincronização automática

### ✅ Notificações Push
- Sistema completo de push notifications
- Gerenciamento de subscrições no Supabase
- Configuração nas Settings do app

### ✅ Auto-Update
- Detecção automática de novas versões
- Prompt ao usuário para atualizar
- Atualização sem perda de dados

## Estrutura do Código

### Componentes PWA
- `src/components/PWAUpdatePrompt.tsx` - Notificações de atualização e status offline
- `src/hooks/usePWA.ts` - Hook para gerenciar estado do PWA
- `src/hooks/useNotifications.ts` - Hook para notificações push
- `src/hooks/useOfflineOperation.ts` - Hook para operações offline

### Serviços
- `src/services/offlineQueueService.ts` - Gerencia fila de operações offline
- `src/services/notificationService.ts` - Gerencia notificações push

### Configuração
- `vite.config.ts` - Configuração do VitePWA
- `public/` - Ícones e assets PWA
- `index.html` - Meta tags PWA

## Configuração

### 1. Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=sua-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-supabase
VITE_VAPID_PUBLIC_KEY=sua-chave-vapid-publica # Opcional, para push notifications
```

### 2. Gerar Chaves VAPID (Para Push Notifications)

```bash
npx web-push generate-vapid-keys
```

Adicione a chave pública ao `.env` e configure a chave privada no backend.

### 3. Build para Produção

```bash
npm run build
```

O build gera:
- `dist/` - Arquivos estáticos
- `dist/sw.js` - Service Worker
- `dist/manifest.webmanifest` - Manifest PWA

### 4. Preview Local

```bash
npm run preview
```

## Deploy

### Vercel (Recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada commit

### Netlify

1. `npm run build`
2. Deploy da pasta `dist/`
3. Configure variáveis de ambiente

### Outros Provedores

Qualquer provedor que suporte sites estáticos (CloudFlare Pages, AWS Amplify, etc.)

## Estratégias de Cache

### Supabase API
- **Estratégia**: Network First
- **Timeout**: 10 segundos
- **Cache**: 5 minutos
- **Max Entries**: 50

### Supabase Storage
- **Estratégia**: Cache First
- **Cache**: 30 dias
- **Max Entries**: 100

### Imagens Locais
- **Estratégia**: Cache First
- **Cache**: 30 dias
- **Max Entries**: 60

## Tabelas Supabase

### push_subscriptions
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT push_subscriptions_user_endpoint_key UNIQUE (user_id, endpoint)
);
```

## Testes

### Lighthouse PWA Audit

Execute no Chrome DevTools:
1. Abra DevTools (F12)
2. Aba "Lighthouse"
3. Selecione "Progressive Web App"
4. Clique em "Generate report"

**Metas:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
- PWA: 100

### Teste de Instalação

1. Acesse o app em produção
2. Clique no ícone de instalação no navegador
3. Verifique que o app é instalado corretamente

### Teste Offline

1. Abra o app
2. Ative modo offline no DevTools (Network tab)
3. Navegue pelo app
4. Verifique funcionalidades offline

### Teste de Push Notifications

1. Vá em Settings
2. Ative "Notificações Push"
3. Aceite a permissão no navegador
4. Verifique que aparece "Ativo" em Settings

## Troubleshooting

### Service Worker não está registrando

- Verifique se está em produção ou se `devOptions.enabled` está `true`
- Limpe cache do navegador
- Verifique console para erros

### Notificações não funcionam

- Verifique se a chave VAPID está configurada
- Verifique permissões do navegador
- Confirme que está em HTTPS (exceto localhost)

### App não é instalável

- Verifique manifest.webmanifest
- Confirme que todos os ícones existem
- Verifique HTTPS (exceto localhost)

## Próximos Passos

- [ ] Implementar backend para envio de push notifications
- [ ] Adicionar analytics para uso offline
- [ ] Implementar sincronização em background
- [ ] Adicionar mais estratégias de cache
- [ ] Implementar badge notifications

## Recursos

- [VitePWA Documentation](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web Push Protocol](https://web.dev/push-notifications/)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
