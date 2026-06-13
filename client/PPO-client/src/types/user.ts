export type UsuarioMe = {
  id: string;
  nome: string;
  email: string;
  cnpj: string;
  consentVersion?: string | null;
  consentAt?: string | null;
  criadoEm?: string | null;
  atualizadoEm?: string | null;
};

export type MeResponse = {
  usuario: UsuarioMe;
  checklists: unknown[];
};

export type UpdateNameResponse = {
  id: string;
  nome: string;
  email: string;
};
