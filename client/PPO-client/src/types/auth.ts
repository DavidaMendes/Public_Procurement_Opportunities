export type RegisterRequest = {
    nome: string;
    email: string;
    senha: string;
    cnpj: string;
};

export type RegisterResponse = {
    id: string;
    nome: string;
    email: string;
};

export type LoginRequest = {
    email: string;
    senha: string;
};

export type LoginResponse = {
    token: string;
};
