# Evidências de testes

Data da verificação local: 2026-06-17.

## Testes estáticos executados

### Lint

Comando:

```bash
cd client/PPO-client
npm run lint
```

Resultado inicial:

- Falhou em `src/contexts/AuthContext.tsx`.
- Motivo: atualização de `tokenRef.current` durante render.
- Correção aplicada: atualização do `tokenRef` movida para `useEffect`.

Resultado esperado após correção:

- `npm run lint` executado novamente em 2026-06-17 e concluído sem erros.

### Typecheck

Comando:

```bash
cd client/PPO-client
npm run typecheck
```

Resultado:

- TypeScript executado em 2026-06-17 e concluído sem erros de compilação.

## Demonstração executável verificada

Comando:

```bash
cd client/PPO-client
npm run web
```

Resultado:

- Expo iniciou em `http://localhost:8082` porque `8081` já estava ocupada.
- Requisição `curl -I http://localhost:8082` retornou `HTTP/1.1 200 OK`.
- Metro exibiu QR Code para teste com Expo Go.

## Roteiro de teste funcional

| ID | Fluxo | Passos | Resultado esperado |
| --- | --- | --- | --- |
| TF-01 | Inicialização | Abrir `/` sem sessão e sem onboarding completo. | Usuário vai para onboarding. |
| TF-02 | Login | Informar e-mail/senha válidos e tocar em Entrar. | Token salvo e navegação para área autenticada. |
| TF-03 | Cadastro | Preencher dados, senha forte, CNPJ e aceitar termos. | Cadastro concluído e retorno para login. |
| TF-04 | Listagem | Abrir Oportunidades. | Lista carrega oportunidades ou mostra estado vazio/erro. |
| TF-05 | Filtros | Preencher filtro, aplicar e limpar. | Lista reflete filtros e pode voltar ao estado inicial. |
| TF-06 | Detalhe | Tocar em uma oportunidade. | Detalhe exibe resumo, órgão, unidade, datas e checklist. |
| TF-07 | Salvar edital | Tocar em Salvar edital no detalhe. | Botão muda para Remover dos salvos e item aparece no dashboard. |
| TF-08 | Checklist | Marcar/desmarcar item no detalhe. | Progresso é atualizado e persistido. |
| TF-09 | Dashboard | Abrir Dashboard. | Total e lista de editais salvos são exibidos. |
| TF-10 | Alertas | Definir data para um edital salvo. | Alerta é salvo, notificação local é agendada e status muda. |
| TF-11 | Documentos | Buscar por "proposta" e expandir modelo. | Modelo correspondente aparece e conteúdo é exibido. |
| TF-12 | Logout | Tocar em Sair. | Sessão é limpa e usuário retorna ao login. |

## Roteiro de teste de usabilidade

Participantes sugeridos: 3 a 5 usuários com perfil de microempresa ou equipe administrativa.

Tarefas:

1. Entrar no app.
2. Encontrar uma oportunidade de interesse.
3. Abrir o detalhe e identificar valor, prazo e órgão.
4. Salvar o edital.
5. Criar um alerta de prazo.
6. Encontrar um modelo de documento.

Métricas:

- Conclusão da tarefa sem ajuda.
- Tempo aproximado por tarefa.
- Dúvidas relatadas pelo usuário.
- Campos ou textos considerados ambíguos.
- Pontos de abandono.

Critérios de aceite:

- Pelo menos 80% dos participantes concluem as tarefas 2 a 6.
- Nenhum participante fica bloqueado por falta de feedback de erro.
- Textos de ação principais são compreendidos sem explicação externa.

## Roteiro de teste de integração

Pré-condição:

- Backend rodando e acessível pelo dispositivo.
- `EXPO_PUBLIC_API_BASE_URL` configurado para o endereço correto.

Casos:

| ID | Integração | Validação |
| --- | --- | --- |
| TI-01 | Auth | Login retorna token e token é enviado em rotas protegidas. |
| TI-02 | Sessão expirada | API retorna 401 e app limpa sessão. |
| TI-03 | Contratações | `/contratacoes` retorna lista paginada e filtros funcionam. |
| TI-04 | Detalhe | `/contratacoes/:id` retorna dados normalizados para a tela. |
| TI-05 | Checklist | Marcação de item persiste ao reabrir detalhe. |
| TI-06 | Salvos | Salvar/remover edital reflete no dashboard. |
| TI-07 | Alertas | Data e status do alerta persistem na API. |

## Evidências a anexar após demonstração

- Captura da tela de login.
- Captura da lista de oportunidades.
- Captura do detalhe com checklist.
- Captura do dashboard com edital salvo.
- Captura da tela de alertas.
- Captura da busca em documentos.
- Registro do QR Code ou APK usado na apresentação.
