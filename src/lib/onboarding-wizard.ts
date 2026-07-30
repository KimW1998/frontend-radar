const WIZARD_KEY = 'frontend-radar-onboarding-wizard'

export interface OnboardingWizardState {
  step: number
  draftProjectId: string | null
  projectName: string
  nodeVersion: string
}

export function readOnboardingWizard(): OnboardingWizardState | null {
  try {
    const raw = sessionStorage.getItem(WIZARD_KEY)
    if (!raw) return null
    return JSON.parse(raw) as OnboardingWizardState
  } catch {
    return null
  }
}

export function saveOnboardingWizard(state: OnboardingWizardState): void {
  sessionStorage.setItem(WIZARD_KEY, JSON.stringify(state))
}

export function clearOnboardingWizard(): void {
  sessionStorage.removeItem(WIZARD_KEY)
}

export function initialWizardStep(): number {
  return readOnboardingWizard()?.step ?? 0
}

export function initialWizardProjectName(): string {
  return readOnboardingWizard()?.projectName ?? ''
}

export function initialWizardDraftId(): string | null {
  return readOnboardingWizard()?.draftProjectId ?? null
}

export function initialWizardNodeVersion(): string {
  return readOnboardingWizard()?.nodeVersion ?? ''
}
