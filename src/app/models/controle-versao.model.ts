export interface ControleVersao {
  id: string;
  ultima_versao: string;
  implementacao: string | null;
  usu_inc_id: string;
  usu_alt_id: string | null;
  usu_inc_nome: string;
  usu_alt_nome: string | null;
  /** Data/hora ISO 8601 em UTC, incluindo sufixo Z. */
  created_at: string;
  update_at: string;
}

export interface VersaoAtualResponse {
  ultima_versao: string | null;
}
