export type ImpactStat = Readonly<{
  id: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  detail?: string;
}>;

export const impactStats: readonly ImpactStat[] = [];
