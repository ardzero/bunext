import { murmurhash } from '@/lib/utils'
import type { Role } from '@/lib/auth/roles'

// the minimum a flag needs to know about the viewer
export type FlagUser = {
    id: string
    role: Role
}

export type FeatureFlagName = keyof typeof FEATURE_FLAGS
// type for multiple allowances
type FeatureFlagRule = {
    percentageOfUsers?: number
    userRoles?: Role[]
} & (
        | {
            percentageOfUsers: number
        }
        | { userRoles: Role[] }
    )

export const FEATURE_FLAGS = {
    NEXT_THEME: true,
    THEME_BUTTON: true, //flase will remove the theme selector button thus not allowing the user to change the theme
    DEFAULT_THEME: 'system', // "system | dark | light" only works if NEXT_THEME is true

    // example of multiple allowances
    // 25% of users can see this feature
    SAMPLE_MULTIPLE_ALLOWANCES: [
        { percentageOfUsers: 0.25, userRoles: ['user'] },
        { userRoles: ['admin'] },
    ],
} as const satisfies Record<string, FeatureFlagRule[] | boolean | string>

// true when the flag depends on who is viewing (role or percentage rules)
export function isUserScopedFeature(featureName: FeatureFlagName) {
    return Array.isArray(FEATURE_FLAGS[featureName])
}

// signed-out viewers (no user) never pass role or percentage rules
export function canViewFeature(featureName: FeatureFlagName, user?: FlagUser | null) {
    const rules = FEATURE_FLAGS[featureName]
    if (typeof rules === 'boolean') return rules
    if (typeof rules === 'string') return rules
    if (!user) return false
    return rules.some((rule) => checkRule(rule, featureName, user))
}

function checkRule(
    { userRoles, percentageOfUsers }: FeatureFlagRule,
    featureName: FeatureFlagName,
    user: FlagUser
) {
    return (
        userHasValidRole(userRoles, user.role) &&
        userIsWithinPercentage(featureName, percentageOfUsers, user.id)
    )
}

function userHasValidRole(
    allowedRoles: Role[] | undefined,
    userRole: Role
) {
    return allowedRoles == null || allowedRoles.includes(userRole)
}

const MAX_UINT_32 = 4294967295
function userIsWithinPercentage(
    featureName: FeatureFlagName,
    allowedPercent: number | undefined,
    flagId: string
) {
    if (allowedPercent == null) return true

    return murmurhash(`${featureName}-${flagId}`) / MAX_UINT_32 < allowedPercent
}
