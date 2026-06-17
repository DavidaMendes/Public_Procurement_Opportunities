# Protótipo de baixa/média fidelidade das telas centrais

Os wireframes abaixo representam as telas já implementadas no app Expo. Eles servem como protótipo textual para validação de fluxo, hierarquia de informação e estados esperados.

## Login

```text
┌─────────────────────────────┐
│ Entrar                      │
│ Acesse sua área...          │
│                             │
│ [E-mail                  ]  │
│ [Senha                  ]   │
│             Esqueci senha   │
│ [ Entrar                 ]  │
│                             │
│ Ainda não tem conta? Criar  │
└─────────────────────────────┘
```

Estados: validação de e-mail/senha, erro de autenticação, loading no botão.

## Cadastro

```text
┌─────────────────────────────┐
│ Novo acesso                 │
│ Criar conta                 │
│                             │
│ [Nome                    ]  │
│ [E-mail                  ]  │
│ [Senha                  ]   │
│ Força da senha              │
│ [Confirmar senha         ]  │
│ [CNPJ                    ]  │
│ [ ] Aceito termos          │
│ [ Cadastrar             ]   │
└─────────────────────────────┘
```

Estados: senha fraca, senha divergente, CNPJ obrigatório, aceite de termos.

## Oportunidades

```text
┌─────────────────────────────┐
│                         Sair│
│ Área autenticada            │
│ Oportunidades               │
│ 25 oportunidades carregadas │
│                             │
│ Filtros                     │
│ [UF] [Modalidade] [Termo]   │
│ [ Aplicar ] [ Limpar ]      │
│                             │
│ ┌─────────────────────────┐ │
│ │ Objeto da contratação   │ │
│ │ Órgão responsável       │ │
│ │ Valor      Prazo        │ │
│ │ Ver detalhes            │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

Estados: carregando lista, lista vazia, erro de API, scroll infinito.

## Detalhe da contratação

```text
┌─────────────────────────────┐
│ Voltar                      │
│ Detalhe da contratação      │
│ Objeto da compra            │
│ Órgão                       │
│ [ Salvar edital ]           │
│                             │
│ Resumo                      │
│ Valor estimado              │
│ Modalidade                  │
│ Processo                    │
│                             │
│ Checklist 3/8               │
│ [x] Ler edital              │
│ [ ] Separar documentos      │
│                             │
│ Órgão / Unidade / Datas     │
└─────────────────────────────┘
```

Estados: carregando detalhe, erro de API, salvar/remover edital, progresso do checklist.

## Documentos

```text
┌─────────────────────────────┐
│ Templates                   │
│ Documentos                  │
│ [Buscar modelo           ]  │
│                             │
│ ┌─────────────────────────┐ │
│ │ Proposta comercial  MD  │ │
│ │ Resumo do modelo        │ │
│ │ Quando usar             │ │
│ │ [ Ver modelo ]          │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

Estados: busca sem resultado, card expandido com conteúdo do template.

## Alertas

```text
┌─────────────────────────────┐
│ Alertas                     │
│ Prazos dos editais salvos   │
│                             │
│ ┌─────────────────────────┐ │
│ │ Objeto salvo            │ │
│ │ Status: Próximo         │ │
│ │ Prazo [2026-06-30]      │ │
│ │ [Salvar] [Concluir]     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

Estados: sem salvos, prazo inválido, vencido, próximo, agendado e concluído.

## Dashboard

```text
┌─────────────────────────────┐
│ Acompanhamento              │
│ Dashboard                   │
│                             │
│ ┌─────────────┐             │
│ │ 3           │             │
│ │ editais     │             │
│ └─────────────┘             │
│                             │
│ Editais salvos              │
│ ┌─────────────────────────┐ │
│ │ Objeto salvo            │ │
│ │ Órgão / valor / local   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

Estados: sem editais salvos, erro ao carregar salvos, navegação para detalhe.
