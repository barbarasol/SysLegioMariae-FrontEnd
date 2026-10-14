import { TipoUnidadeCodigo } from "../../models/unidade.model";

/**
 * Hierarquia das unidades legionárias.
 *
 * Cada chave é o tipo da unidade e o valor lista os tipos que
 * podem ser sua UNIDADE SUPERIOR, ou seja, os níveis
 * ACIMA dele na estrutura.
 *
 * Lendo a regra de baixo para cima:
 *   PRAESIDIUM aceita como pai: CURIA, COMITIUM, REGIA, SENATUS, CONCILIUM
 *   CURIA      aceita como pai: COMITIUM, REGIA, SENATUS, CONCILIUM
 *   COMITIUM   aceita como pai: REGIA, SENATUS, CONCILIUM
 *   REGIA      aceita como pai: SENATUS, CONCILIUM
 *   SENATUS    aceita como pai: CONCILIUM
 *   CONCILIUM  é o topo — não aceita pai
 *   PATRICIOS  liga-se sob PRAESIDIUM
 *   VELITE     liga-se sob CURIA, COMITIUM, REGIA, SENATUS, CONCILIUM
 */
export const HIERARQUIA_UNIDADE: Record<
  TipoUnidadeCodigo,
  TipoUnidadeCodigo[]
> = {
  PRAESIDIUM: [
    'CURIA',
    'COMITIUM',
    'REGIA',
    'SENATUS',
    'CONCILIUM'
  ],
  PATRICIOS: [
    'PRAESIDIUM'
  ],
  CURIA: [
    'COMITIUM',
    'REGIA',
    'SENATUS',
    'CONCILIUM'
  ],
  COMITIUM: [
    'REGIA',
    'SENATUS',
    'CONCILIUM'
  ],
  REGIA: [
    'SENATUS',
    'CONCILIUM'
  ],
  SENATUS: [
    'CONCILIUM'
  ],
  CONCILIUM: [],
  VELITE: [
    'CURIA',
    'COMITIUM',
    'REGIA',
    'SENATUS',
    'CONCILIUM'
  ]
};

/** Rótulos de exibição de cada tipo. */
export const NOME_TIPO_UNIDADE: Record<TipoUnidadeCodigo, string> = {
  CONCILIUM: 'Concilium',
  SENATUS: 'Senatus',
  REGIA: 'Regia',
  COMITIUM: 'Comitium',
  CURIA: 'Cúria',
  PRAESIDIUM: 'Praesidium',
  VELITE: 'Velite',
  PATRICIOS: 'Patrícios'
};

/** Todos os tipos, na ordem hierárquica. */
export const TIPOS_UNIDADE: TipoUnidadeCodigo[] = [
  'CONCILIUM',
  'SENATUS',
  'REGIA',
  'COMITIUM',
  'CURIA',
  'PRAESIDIUM',
  'PATRICIOS',
  'VELITE'
];

/**
 * Tipos que podem ser PAI do tipo informado — os níveis acima.
 * Lista vazia quando o tipo é o topo (CONCILIUM) ou não foi informado.
 */
export function tiposSuperiorPermitidos(
  tipo: TipoUnidadeCodigo | '' | null
): TipoUnidadeCodigo[] {
  if (!tipo) {
    return [];
  }

  return HIERARQUIA_UNIDADE[tipo] ?? [];
}

/**
 * Tipos que podem ser FILHO do tipo informado — os níveis abaixo.
 * Derivado do próprio mapa, para não haver duas fontes de verdade.
 */
export function tiposFilhoPermitidos(
  tipo: TipoUnidadeCodigo | '' | null
): TipoUnidadeCodigo[] {
  if (!tipo) {
    return [];
  }

  return TIPOS_UNIDADE.filter((filho) =>
    HIERARQUIA_UNIDADE[filho]?.includes(tipo)
  );
}

/** O tipo aceita alguém abaixo dele? */
export function podeTerFilhos(
  tipo: TipoUnidadeCodigo
): boolean {
  return tiposFilhoPermitidos(tipo).length > 0;
}

/**
 * A dupla filho -> pai é permitida pela hierarquia?
 * Útil para validar antes de enviar e para telas de consulta.
 */
export function hierarquiaPermitida(
  tipoFilho: TipoUnidadeCodigo | '' | null,
  tipoPai: TipoUnidadeCodigo | '' | null
): boolean {
  if (!tipoFilho || !tipoPai) {
    return false;
  }

  return tiposSuperiorPermitidos(tipoFilho).includes(tipoPai);
}

/** Nome de exibição do tipo. */
export function nomeTipoUnidade(
  tipo: TipoUnidadeCodigo | '' | null
): string {
  if (!tipo) {
    return '-';
  }

  return NOME_TIPO_UNIDADE[tipo] ?? tipo;
}
