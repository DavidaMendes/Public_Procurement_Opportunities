import type { ChecklistTemplateItem } from "@/types/checklist";

export const checklistTemplate: ChecklistTemplateItem[] = [
  {
    key: "habilitacao_juridica",
    label: "Habilitação jurídica",
    description: "Confira CNPJ, registro empresarial e documentos que comprovam a existência legal do MEI.",
  },
  {
    key: "regularidade_fiscal",
    label: "Regularidade fiscal",
    description: "Verifique certidões, tributos e pendências fiscais antes de preparar a proposta.",
  },
  {
    key: "regularidade_trabalhista",
    label: "Regularidade trabalhista",
    description: "Confira comprovações trabalhistas exigidas, como certidões e ausência de débitos aplicáveis.",
  },
  {
    key: "qualificacao_tecnica",
    label: "Qualificação técnica",
    description: "Avalie se há exigência de atestados, experiência anterior ou capacidade técnica compatível.",
  },
  {
    key: "qualificacao_economico_financeira",
    label: "Qualificação econômico-financeira",
    description: "Verifique se o edital exige balanços, declarações ou comprovação financeira específica.",
  },
  {
    key: "proposta_comercial",
    label: "Proposta comercial",
    description: "Monte preço, prazo e condições de entrega de acordo com o edital.",
  },
  {
    key: "prazos_e_forma_de_envio",
    label: "Prazos e forma de envio",
    description: "Revise data limite, local de envio, formato da proposta e demais instruções de participação.",
  },
];
