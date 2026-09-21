const KG_A_LB = 2.20462;

export function kgALibras(kg: number): number {
  return Math.round(kg * KG_A_LB * 10) / 10;
}

export function formatearPesoKgLb(kg: number): string {
  return `${kg} kg (${kgALibras(kg)} lb)`;
}
