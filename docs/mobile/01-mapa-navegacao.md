# Mapa de navegação e rotas principais

O app usa `expo-router` com roteamento baseado em arquivos dentro de `client/PPO-client/src/app`.

## Fluxo geral

```text
/
├─ verifica sessão e onboarding
├─ usuário autenticado -> /(app)
├─ onboarding pendente -> /onboarding
└─ sem sessão -> /(auth)/login
```

## Rotas públicas

| Rota | Arquivo | Finalidade |
| --- | --- | --- |
| `/` | `src/app/index.tsx` | Decide redirecionamento inicial por sessão e onboarding. |
| `/onboarding` | `src/app/onboarding.tsx` | Apresenta introdução ao app antes do primeiro login. |
| `/(auth)/login` | `src/app/(auth)/login.tsx` | Autentica usuário e inicia sessão. |
| `/(auth)/register` | `src/app/(auth)/register.tsx` | Cadastra usuário e empresa/CNPJ. |
| `/(auth)/forgot-password` | `src/app/(auth)/forgot-password.tsx` | Solicita recuperação de senha. |
| `/(auth)/reset` | `src/app/(auth)/reset.tsx` | Redefine senha. |
| `/(legal)/termos` | `src/app/(legal)/termos.tsx` | Termos de uso. |
| `/(legal)/privacidade` | `src/app/(legal)/privacidade.tsx` | Política de privacidade. |

## Rotas autenticadas

`src/app/(app)/_layout.tsx` protege a área autenticada. Se não houver token, o usuário volta para login.

| Rota | Arquivo | Finalidade |
| --- | --- | --- |
| `/(app)` | `src/app/(app)/index.tsx` | Redireciona para a área principal. |
| `/(app)/(tabs)/oportunidades` | `src/app/(app)/(tabs)/oportunidades/index.tsx` | Lista oportunidades com filtros e paginação. |
| `/(app)/contratacoes/[id]` | `src/app/(app)/contratacoes/[id].tsx` | Detalha a contratação, checklist e ação de salvar edital. |
| `/(app)/(tabs)/documentos` | `src/app/(app)/(tabs)/documentos/index.tsx` | Lista e exibe modelos de documentos. |
| `/(app)/(tabs)/alertas` | `src/app/(app)/(tabs)/alertas/index.tsx` | Gerencia prazos e notificações de oportunidades salvas. |
| `/(app)/(tabs)/dashboard` | `src/app/(app)/(tabs)/dashboard/index.tsx` | Mostra editais salvos para acompanhamento. |
| `/(app)/alterar-senha` | `src/app/(app)/alterar-senha.tsx` | Altera senha do usuário logado. |

## Navegação por abas

```text
Área autenticada
├─ Oportunidades
│  └─ Detalhe da contratação
├─ Documentos
├─ Alertas
└─ Dashboard
   └─ Detalhe da contratação
```

## Regras principais

- O token é carregado no `AuthProvider` a partir do armazenamento seguro.
- Erros HTTP 401 limpam a sessão por meio do handler global de API.
- A navegação inicial respeita onboarding antes de exibir login.
- O detalhe de contratação é acessado por ID a partir da lista de oportunidades ou do dashboard.
- Alertas dependem de oportunidades salvas.
