export function upgradePlanHref(npmPackage: string): string {
  return `/upgrade-plan?package=${encodeURIComponent(npmPackage)}`
}
