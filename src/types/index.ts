import { z } from 'zod'

export const UpgradeUrgencySchema = z.enum([
  'immediate',
  'this-sprint',
  'next-sprint',
  'backlog',
])
export type UpgradeUrgency = z.infer<typeof UpgradeUrgencySchema>

export const RiskLevelSchema = z.enum(['safe', 'recommended', 'major', 'security'])
export type RiskLevel = z.infer<typeof RiskLevelSchema>

export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low'])
export type Severity = z.infer<typeof SeveritySchema>

export const FilterCategorySchema = z.enum([
  'security',
  'react',
  'typescript',
  'node',
  'testing',
  'ui-libraries',
  'infrastructure',
])
export type FilterCategory = z.infer<typeof FilterCategorySchema>

export const AiSummarySchema = z.object({
  whatHappened: z.string(),
  whyCare: z.string(),
  actionRequired: z.string(),
  upgradeUrgency: UpgradeUrgencySchema,
  readingTimeSeconds: z.number(),
})
export type AiSummary = z.infer<typeof AiSummarySchema>

export const UpgradeBlockerSchema = z.object({
  packageName: z.string(),
  npmPackage: z.string(),
  requiredRange: z.string(),
  currentVersion: z.string(),
  targetVersion: z.string(),
  message: z.string(),
})
export type UpgradeBlocker = z.infer<typeof UpgradeBlockerSchema>

export const UpgradePlanPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  npmPackage: z.string(),
  fromVersion: z.string(),
  toVersion: z.string(),
})
export type UpgradePlanPackage = z.infer<typeof UpgradePlanPackageSchema>

export const UpgradePlanStepSchema = z.object({
  step: z.number(),
  title: z.string(),
  packages: z.array(UpgradePlanPackageSchema),
})
export type UpgradePlanStep = z.infer<typeof UpgradePlanStepSchema>

export const DependencySchema = z.object({
  id: z.string(),
  name: z.string(),
  npmPackage: z.string().optional(),
  currentVersion: z.string(),
  latestVersion: z.string(),
  recommendedVersion: z.string(),
  riskLevel: RiskLevelSchema,
  breakingChanges: z.boolean(),
  breakingApiChanges: z.array(z.string()).optional(),
  releaseNotesSummary: z.string(),
  releaseNotesFull: z.string().optional(),
  releasePublishedAt: z.string().optional(),
  securityIssues: z.number(),
  categories: z.array(FilterCategorySchema),
  sourceUrl: z.string().optional(),
  vulnerabilities: z
    .array(
      z.object({
        id: z.string(),
        summary: z.string(),
        severity: SeveritySchema,
        fixedVersion: z.string().nullable().optional(),
        details: z.string().optional(),
      }),
    )
    .optional(),
  peerDependencies: z.record(z.string()).optional(),
  upgradeBlockers: z.array(UpgradeBlockerSchema).optional(),
  relatedUpgrades: z.array(z.string()).optional(),
  summary: AiSummarySchema,
})
export type Dependency = z.infer<typeof DependencySchema>

export const SecurityAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: SeveritySchema,
  affectedPackage: z.string(),
  advisoryId: z.string().optional(),
  actionNeeded: z.string(),
  sourceUrl: z.string(),
  publishedAt: z.string(),
  fixedVersion: z.string().nullable().optional(),
  details: z.string().optional(),
  categories: z.array(FilterCategorySchema),
  summary: AiSummarySchema,
})
export type SecurityAlert = z.infer<typeof SecurityAlertSchema>

export const BreakingChangeSchema = z.object({
  id: z.string(),
  technology: z.string(),
  title: z.string(),
  whatChanged: z.string(),
  codeExample: z.string(),
  migrationGuidance: z.string(),
  version: z.string(),
  sourceUrl: z.string(),
  breakingApiChanges: z.array(z.string()).optional(),
  releaseNotesFull: z.string().optional(),
  categories: z.array(FilterCategorySchema),
  summary: AiSummarySchema,
})
export type BreakingChange = z.infer<typeof BreakingChangeSchema>

export const NodeReleaseSchema = z.object({
  version: z.string(),
  codename: z.string().optional(),
  releaseDate: z.string(),
  supportEndDate: z.string(),
  isLts: z.boolean(),
  isCurrent: z.boolean(),
})
export type NodeRelease = z.infer<typeof NodeReleaseSchema>

export const NodeStatusSchema = z.object({
  currentVersion: z.string(),
  latestLts: NodeReleaseSchema,
  latestCurrent: NodeReleaseSchema,
  status: z.enum(['supported', 'upgrade-recommended', 'end-of-life']),
  whyUpgrade: z.string(),
  newFeatures: z.array(z.string()),
  securityImplications: z.string(),
  migrationEffort: z.enum(['low', 'medium', 'high']),
  summary: AiSummarySchema,
})
export type NodeStatus = z.infer<typeof NodeStatusSchema>

export const ExecutiveActionSchema = z.object({
  id: z.string(),
  type: z.enum(['security', 'dependency', 'breaking', 'deprecation', 'recommendation']),
  title: z.string(),
  why: z.string(),
  action: z.string(),
  impact: z.enum(['low', 'medium', 'high']),
  urgency: UpgradeUrgencySchema,
  categories: z.array(FilterCategorySchema),
  breakingApiChanges: z.array(z.string()).optional(),
})
export type ExecutiveAction = z.infer<typeof ExecutiveActionSchema>

export const RecommendedActionSchema = z.object({
  action: z.string(),
  why: z.string(),
  impact: z.enum(['low', 'medium', 'high']),
})
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>

export const HealthScoreSchema = z.object({
  score: z.number().min(0).max(100),
  securityWeight: z.number(),
  outdatedWeight: z.number(),
  nodeSupportWeight: z.number(),
  breakingChangesWeight: z.number(),
  recommendedActions: z.array(RecommendedActionSchema),
})
export type HealthScore = z.infer<typeof HealthScoreSchema>

export const DataSourceStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  endpoint: z.string(),
  status: z.enum(['ok', 'partial', 'error', 'unavailable']),
  message: z.string(),
  itemCount: z.number(),
})
export type DataSourceStatus = z.infer<typeof DataSourceStatusSchema>

export const DashboardDataSchema = z.object({
  dependencies: z.array(DependencySchema),
  securityAlerts: z.array(SecurityAlertSchema),
  breakingChanges: z.array(BreakingChangeSchema),
  nodeStatus: NodeStatusSchema,
  executiveActions: z.array(ExecutiveActionSchema),
  healthScore: HealthScoreSchema,
  dataSources: z.array(DataSourceStatusSchema),
  upgradePlan: z.array(UpgradePlanStepSchema),
  lastUpdated: z.string(),
})
export type DashboardData = z.infer<typeof DashboardDataSchema>

export const AppSettingsSchema = z.object({
  configuredVersions: z.record(z.string(), z.string()),
  nodeVersion: z.string(),
})
export type AppSettings = z.infer<typeof AppSettingsSchema>

export const FILTER_LABELS: Record<FilterCategory, string> = {
  security: 'Security',
  react: 'React',
  typescript: 'TypeScript',
  node: 'Node',
  testing: 'Testing',
  'ui-libraries': 'UI Libraries',
  infrastructure: 'Infrastructure',
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  safe: '#22C55E',
  recommended: '#EAB308',
  major: '#F97316',
  security: '#EF4444',
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#6B7280',
}

export const URGENCY_LABELS: Record<UpgradeUrgency, string> = {
  immediate: 'Immediate',
  'this-sprint': 'This Sprint',
  'next-sprint': 'Next Sprint',
  backlog: 'Backlog',
}
