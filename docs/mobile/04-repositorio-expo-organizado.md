# Repositório Expo organizado

## Localização

O aplicativo mobile está em:

```text
client/PPO-client
```

## Stack

- Expo SDK 55
- React 19
- React Native 0.83
- TypeScript
- expo-router
- React Hook Form
- Zod
- Expo SecureStore
- Expo Notifications

## Estrutura principal

```text
client/PPO-client
├─ app.json
├─ package.json
├─ tsconfig.json
├─ assets/
└─ src/
   ├─ app/
   │  ├─ (app)/
   │  ├─ (auth)/
   │  ├─ (legal)/
   │  ├─ _layout.tsx
   │  ├─ index.tsx
   │  └─ onboarding.tsx
   ├─ components/
   │  ├─ contratacoes/
   │  └─ ui/
   ├─ contexts/
   ├─ features/
   ├─ helpers/
   ├─ hooks/
   ├─ services/
   ├─ theme/
   └─ types/
```

## Organização por responsabilidade

| Pasta | Responsabilidade |
| --- | --- |
| `src/app` | Rotas, layouts e telas usando expo-router. |
| `src/components/ui` | Componentes reutilizáveis de interface: botão, campo, checkbox, tela, erro e loading. |
| `src/components/contratacoes` | Componentes específicos de oportunidades, filtros e checklist. |
| `src/contexts` | Estado global de autenticação e sessão. |
| `src/features/auth` | Validações e regras de senha para autenticação. |
| `src/hooks` | Hooks de autenticação, salvos e checklist. |
| `src/services/api` | Cliente HTTP, base URL, erros e handler de sessão expirada. |
| `src/services/auth` | Login, logout, cadastro e armazenamento de token. |
| `src/services/contratacoes` | Listagem, detalhe, filtros, parsers e mapeadores. |
| `src/services/checklist` | Serviço e itens de checklist. |
| `src/services/saved-opportunities` | Salvar, remover e atualizar acompanhamento de edital. |
| `src/services/notifications` | Agendamento e cancelamento de notificações locais. |
| `src/services/documents` | Catálogo de templates de documentos. |
| `src/theme` | Tokens de cor, espaçamento, tipografia e raio. |
| `src/types` | Tipos compartilhados por telas e serviços. |

## Padrões já aplicados

- Rotas protegidas em `src/app/(app)/_layout.tsx`.
- Decisão inicial de fluxo em `src/app/index.tsx`.
- Serviços isolados das telas para chamadas HTTP e persistência.
- Hooks para encapsular dados de sessão, checklist e oportunidades salvas.
- Componentes de UI reutilizáveis para manter consistência visual.
- Tipos dedicados para contratos de API e modelos usados na interface.
- Configuração de API por `EXPO_PUBLIC_API_BASE_URL` ou `expo.extra.apiBaseUrl`.

## Melhorias técnicas recomendadas

- Adicionar testes automatizados com Jest e React Native Testing Library.
- Criar mocks de API para testes de fluxo offline.
- Criar configuração EAS Build para APK/AAB e perfil de preview.
- Adicionar ícones nas abas para melhorar reconhecimento visual.
