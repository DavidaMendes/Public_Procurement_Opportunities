export type ChecklistKey =
  | "habilitacao_juridica"
  | "regularidade_fiscal"
  | "regularidade_trabalhista"
  | "qualificacao_tecnica"
  | "qualificacao_economico_financeira"
  | "proposta_comercial"
  | "prazos_e_forma_de_envio";

export type ChecklistTemplateItem = {
  key: ChecklistKey;
  label: string;
  description: string;
};

export type ChecklistItem = ChecklistTemplateItem & {
  completed: boolean;
};

export type ChecklistApiItem = {
  key: ChecklistKey;
  checked: boolean;
};

export type ChecklistResponse = {
  items: ChecklistApiItem[];
};
