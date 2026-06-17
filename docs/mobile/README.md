# Artefatos mobile - PPO

Este diretório consolida os artefatos esperados para a disciplina mobile do projeto **Public Procurement Opportunities (PPO)**.

## Artefatos

| Artefato esperado | Documento |
| --- | --- |
| Mapa de navegação do aplicativo e definição das rotas principais | [01-mapa-navegacao.md](01-mapa-navegacao.md) |
| Protótipo de baixa e/ou média fidelidade das telas centrais | [02-prototipo-telas-centrais.md](02-prototipo-telas-centrais.md) |
| Backlog técnico do app com épicos, histórias e critérios de aceite | [03-backlog-tecnico.md](03-backlog-tecnico.md) |
| Repositório Expo organizado com componentes, telas, serviços e hooks | [04-repositorio-expo-organizado.md](04-repositorio-expo-organizado.md) |
| Builds ou demonstrações executáveis para validação em dispositivo real | [05-builds-demonstracoes.md](05-builds-demonstracoes.md) |
| Evidências de testes funcionais, de usabilidade e de integração | [06-evidencias-testes.md](06-evidencias-testes.md) |

## Escopo mobile atual

O app Expo em `client/PPO-client` implementa uma experiência autenticada para micro e pequenas empresas acompanharem oportunidades de contratação pública:

- onboarding e autenticação;
- cadastro, login, recuperação e alteração de senha;
- listagem de contratações com filtros e paginação;
- detalhe da contratação com resumo, órgão, unidade, datas e checklist;
- salvamento de editais para acompanhamento;
- dashboard de editais salvos;
- alertas locais de prazo;
- consulta de modelos de documentos exigidos em editais;
- telas legais de termos e privacidade.

## Como validar rapidamente

```bash
cd client/PPO-client
npm install
npm run lint
npm run typecheck
npx expo start
```

Para testar em dispositivo real, abra o QR Code exibido pelo Expo no aplicativo Expo Go, com `EXPO_PUBLIC_API_BASE_URL` apontando para a API acessível pelo celular.
