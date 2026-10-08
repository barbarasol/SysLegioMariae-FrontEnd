export interface LoginRequest {
  email: string;
  senha: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface UsuarioContexto {
  usuario: {
    id: string;
    email: string;
    status: string;
  };
  pessoa: {
    id: string;
    nome: string;
    nomePreferido: string | null;
  };
  membro: {
    id: string;
  } | null;
  perfisGlobais: string[];
  unidades: Array<{
    id: string;
    nome: string;
    tipo: string;
    gestaoLiberada: boolean;
    perfis: string[];
  }>;
}
