import type { DocumentTemplate } from "@/types/documentTemplate";

export const documentTemplates: DocumentTemplate[] = [
  {
    id: "declaracao-habilitacao-juridica",
    title: "Declaração de habilitação jurídica",
    requiredWhen: "Quando o edital pedir comprovação de existência legal, CNPJ ou habilitação jurídica.",
    format: "PDF assinado",
    templatePath: "docs/mobile/templates/declaracao-habilitacao-juridica.md",
    summary: "Modelo para declarar identificação do MEI e aptidão jurídica básica para participar.",
    template: `DECLARAÇÃO DE HABILITAÇÃO JURÍDICA

Eu, [NOME DO RESPONSÁVEL], inscrito no CPF sob nº [CPF], representante do MEI [NOME EMPRESARIAL], inscrito no CNPJ sob nº [CNPJ], declaro, para fins de participação no processo [NÚMERO DO PROCESSO], que a empresa está regularmente constituída e apta a exercer suas atividades.

Declaro ainda que as informações apresentadas são verdadeiras e que os documentos de identificação empresarial estão disponíveis para conferência.

[CIDADE], [DATA]

[NOME E ASSINATURA DO RESPONSÁVEL]`,
  },
  {
    id: "declaracao-regularidade-fiscal",
    title: "Declaração de regularidade fiscal",
    requiredWhen: "Quando o edital pedir regularidade fiscal, certidões fiscais ou inexistência de débitos.",
    format: "PDF assinado + certidões anexas",
    templatePath: "docs/mobile/templates/declaracao-regularidade-fiscal.md",
    summary: "Modelo para acompanhar certidões fiscais e declarar ciência sobre a regularidade exigida.",
    template: `DECLARAÇÃO DE REGULARIDADE FISCAL

Eu, [NOME DO RESPONSÁVEL], representante do MEI [NOME EMPRESARIAL], CNPJ nº [CNPJ], declaro que estou ciente das exigências de regularidade fiscal previstas no edital/processo [NÚMERO DO PROCESSO].

Declaro que serão apresentados, quando solicitados, os comprovantes e certidões aplicáveis, incluindo regularidade perante órgãos fiscais competentes.

[CIDADE], [DATA]

[NOME E ASSINATURA DO RESPONSÁVEL]`,
  },
  {
    id: "declaracao-regularidade-trabalhista",
    title: "Declaração de regularidade trabalhista",
    requiredWhen: "Quando o edital pedir regularidade trabalhista ou declaração de cumprimento da legislação.",
    format: "PDF assinado",
    templatePath: "docs/mobile/templates/declaracao-regularidade-trabalhista.md",
    summary: "Modelo para declarar cumprimento de obrigações trabalhistas aplicáveis.",
    template: `DECLARAÇÃO DE REGULARIDADE TRABALHISTA

Eu, [NOME DO RESPONSÁVEL], representante do MEI [NOME EMPRESARIAL], CNPJ nº [CNPJ], declaro, para fins de participação no processo [NÚMERO DO PROCESSO], que cumpro as obrigações trabalhistas aplicáveis à atividade exercida.

Declaro também estar ciente das exigências previstas no edital e da necessidade de apresentar documentação complementar, se solicitada.

[CIDADE], [DATA]

[NOME E ASSINATURA DO RESPONSÁVEL]`,
  },
  {
    id: "atestado-capacidade-tecnica",
    title: "Atestado de capacidade técnica",
    requiredWhen: "Quando o edital pedir experiência anterior, capacidade técnica ou comprovação de serviço similar.",
    format: "PDF emitido por cliente ou contratante anterior",
    templatePath: "docs/mobile/templates/atestado-capacidade-tecnica.md",
    summary: "Modelo para cliente anterior declarar que o MEI executou serviço ou fornecimento semelhante.",
    template: `ATESTADO DE CAPACIDADE TÉCNICA

Atestamos, para os devidos fins, que [NOME EMPRESARIAL], inscrito no CNPJ sob nº [CNPJ], prestou/forneceu [DESCREVER SERVIÇO OU PRODUTO] para [NOME DO CLIENTE/ÓRGÃO/EMPRESA].

O serviço/fornecimento foi realizado no período de [PERÍODO], com qualidade compatível e atendimento às condições acordadas.

[CIDADE], [DATA]

[NOME, CARGO, CPF/CNPJ E ASSINATURA DE QUEM EMITE]`,
  },
  {
    id: "proposta-comercial",
    title: "Proposta comercial",
    requiredWhen: "Quando o edital pedir proposta de preço, orçamento, prazo de entrega ou condições comerciais.",
    format: "PDF assinado",
    templatePath: "docs/mobile/templates/proposta-comercial.md",
    summary: "Modelo para apresentar preço, validade, prazo e condições de fornecimento.",
    template: `PROPOSTA COMERCIAL

Processo/Edital: [NÚMERO DO PROCESSO]
Objeto: [DESCRIÇÃO DO OBJETO]
Proponente: [NOME EMPRESARIAL]
CNPJ: [CNPJ]

Item: [ITEM]
Descrição: [DESCRIÇÃO]
Quantidade: [QUANTIDADE]
Valor unitário: [VALOR]
Valor total: [VALOR]

Prazo de entrega/execução: [PRAZO]
Validade da proposta: [VALIDADE]
Condições de pagamento: [CONDIÇÕES]

[CIDADE], [DATA]

[NOME E ASSINATURA DO RESPONSÁVEL]`,
  },
  {
    id: "declaracao-inexistencia-impedimento",
    title: "Declaração de inexistência de impedimento",
    requiredWhen: "Quando o edital pedir declaração de que a empresa não está impedida de contratar.",
    format: "PDF assinado",
    templatePath: "docs/mobile/templates/declaracao-inexistencia-impedimento.md",
    summary: "Modelo para declarar que não há impedimento conhecido para participar da contratação.",
    template: `DECLARAÇÃO DE INEXISTÊNCIA DE IMPEDIMENTO

Eu, [NOME DO RESPONSÁVEL], representante do MEI [NOME EMPRESARIAL], CNPJ nº [CNPJ], declaro que, até a presente data, não tenho conhecimento de impedimento legal que impossibilite a participação no processo [NÚMERO DO PROCESSO].

Declaro estar ciente de que a falsidade desta declaração poderá resultar nas sanções previstas em lei e no edital.

[CIDADE], [DATA]

[NOME E ASSINATURA DO RESPONSÁVEL]`,
  },
];
