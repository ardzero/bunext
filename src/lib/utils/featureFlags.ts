import { murmurhash } from '@/lib/utils'
import type { User, UserRole } from './user'

export type FeatureFlagName = keyof typeof FEATURE_FLAGS
// type for multiple allowances
type FeatureFlagRule = {
    percentageOfUsers?: number
    userRoles?: UserRole[]
} & (
        | {
            percentageOfUsers: number
        }
        | { userRoles: UserRole[] }
    )

export const FEATURE_FLAGS = {
    NEXT_THEME: true,
    THEME_BUTTON: true, //flase will remove the theme selector button thus not allowing the user to change the theme
    DEFAULT_THEME: 'system', // "system | dark | light" only works if NEXT_THEME is true

    // example of multiple allowances
    // 25% of users can see this feature
    SAMPLE_MULTIPLE_ALLOWANCES: [
        { percentageOfUsers: 0.25, userRoles: ['user'] },
        { userRoles: ['admin', 'tester'] },
    ],
} as const satisfies Record<string, FeatureFlagRule[] | boolean | string>

export function canViewFeature(featureName: FeatureFlagName, user: User) {
    const rules = FEATURE_FLAGS[featureName]
    if (typeof rules === 'boolean') return rules
    if (typeof rules === 'string') return rules
    return rules.some((rule) => checkRule(rule, featureName, user))
}

function checkRule(
    { userRoles, percentageOfUsers }: FeatureFlagRule,
    featureName: FeatureFlagName,
    user: User
) {
    return (
        userHasValidRole(userRoles, user.role) &&
        userIsWithinPercentage(featureName, percentageOfUsers, user.id)
    )
}

function userHasValidRole(
    allowedRoles: UserRole[] | undefined,
    userRole: UserRole
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
