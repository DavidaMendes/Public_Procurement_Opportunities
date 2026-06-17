# Backlog técnico do app

## Épico 1 - Acesso e sessão

### História 1.1 - Login de usuário

Como usuário cadastrado, quero entrar com e-mail e senha para acessar minhas oportunidades.

Critérios de aceite:

- Deve validar e-mail e senha antes da chamada de API.
- Deve exibir erro retornado pela API quando a autenticação falhar.
- Deve salvar o token com armazenamento seguro.
- Deve redirecionar para a área autenticada após sucesso.

### História 1.2 - Cadastro com CNPJ e termos

Como novo usuário, quero criar uma conta informando dados pessoais e CNPJ para usar o app.

Critérios de aceite:

- Deve exigir nome, e-mail, senha, confirmação de senha e CNPJ.
- Deve validar força mínima da senha.
- Deve exigir aceite de termos e política de privacidade.
- Deve redirecionar para login após cadastro bem-sucedido.

### História 1.3 - Sessão expirada

Como usuário, quero ser redirecionado ao login quando minha sessão expirar.

Critérios de aceite:

- Toda resposta 401 deve limpar a sessão local.
- A área autenticada deve ser protegida contra acesso sem token.
- O app não deve manter dados de sessão após logout.

## Épico 2 - Consulta de oportunidades

### História 2.1 - Listar oportunidades

Como usuário, quero visualizar oportunidades públicas para identificar editais relevantes.

Critérios de aceite:

- Deve carregar oportunidades a partir da API.
- Deve apresentar objeto, órgão, valor estimado e prazo.
- Deve suportar estado de carregamento, vazio e erro.
- Deve paginar ou carregar mais itens ao final da lista.

### História 2.2 - Filtrar oportunidades

Como usuário, quero filtrar oportunidades para reduzir a lista ao meu interesse.

Critérios de aceite:

- Deve permitir preencher filtros compatíveis com a API.
- Deve normalizar filtros vazios antes da chamada.
- Deve mostrar a quantidade de oportunidades encontradas.
- Deve permitir limpar todos os filtros.

### História 2.3 - Ver detalhe da contratação

Como usuário, quero abrir uma oportunidade para avaliar se devo participar.

Critérios de aceite:

- Deve abrir detalhe por ID.
- Deve mostrar resumo, órgão, unidade e datas.
- Deve tratar erro de carregamento e permitir tentar novamente.
- Deve preservar navegação de retorno.

## Épico 3 - Acompanhamento de editais

### História 3.1 - Salvar edital

Como usuário, quero salvar editais para acompanhar oportunidades importantes.

Critérios de aceite:

- Deve salvar e remover edital a partir da tela de detalhe.
- Deve refletir o estado salvo/removido no botão.
- Deve aparecer no dashboard após salvar.
- Deve cancelar alerta local ao remover edital salvo.

### História 3.2 - Dashboard de salvos

Como usuário, quero ver meus editais salvos em um painel resumido.

Critérios de aceite:

- Deve mostrar total de editais salvos.
- Deve listar objeto, órgão, valor, local e data de salvamento.
- Deve abrir o detalhe ao tocar em um item.
- Deve tratar lista vazia e erro.

### História 3.3 - Checklist por contratação

Como usuário, quero marcar tarefas de análise do edital para controlar meu progresso.

Critérios de aceite:

- Deve carregar itens do checklist por contratação.
- Deve permitir marcar e desmarcar itens.
- Deve calcular progresso.
- Deve persistir alterações via API.

## Épico 4 - Alertas e prazos

### História 4.1 - Configurar prazo de alerta

Como usuário, quero definir prazo para um edital salvo para não perder datas importantes.

Critérios de aceite:

- Deve permitir informar data em formato válido.
- Deve salvar a data na API.
- Deve agendar notificação local quando aplicável.
- Deve exibir erro quando a data estiver ausente ou inválida.

### História 4.2 - Status de alerta

Como usuário, quero ver quais alertas estão vencidos, próximos, agendados ou concluídos.

Critérios de aceite:

- Deve classificar alertas por status.
- Deve ordenar vencidos e próximos antes dos demais.
- Deve permitir marcar alerta como concluído.
- Deve cancelar notificação local ao concluir.

## Épico 5 - Apoio documental

### História 5.1 - Consultar modelos de documentos

Como usuário, quero consultar modelos de declarações e propostas para preparar minha participação.

Critérios de aceite:

- Deve listar templates disponíveis.
- Deve permitir buscar por título, resumo, formato ou quando usar.
- Deve expandir e ocultar o conteúdo do modelo.
- Deve informar quando nenhum modelo for encontrado.

## Épico 6 - Qualidade e entrega

### História 6.1 - Verificação estática

Como equipe técnica, queremos lint e typecheck passando para reduzir erros antes da demonstração.

Critérios de aceite:

- `npm run lint` deve concluir sem erros.
- `npx tsc --noEmit` deve concluir sem erros.
- Evidências devem ser registradas em `docs/mobile/07-evidencias-testes.md`.

### História 6.2 - Demonstração em dispositivo real

Como avaliador, quero executar o app em um celular para validar fluxos reais.

Critérios de aceite:

- O app deve iniciar com `npx expo start`.
- O QR Code deve abrir no Expo Go.
- A variável `EXPO_PUBLIC_API_BASE_URL` deve apontar para uma API acessível pelo celular.
- O roteiro de demonstração deve cobrir login, oportunidades, detalhe, salvar, dashboard, alertas e documentos.
