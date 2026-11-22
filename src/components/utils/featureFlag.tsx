// component to check feature flags before rendering a component
import * as featureflags from "@/lib/utils/featureFlags";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_ROLE, parseRoles } from "@/lib/auth/roles";
import type { ReactNode } from "react";

// Reads the session only for role/percentage flags, so pages that use plain
// boolean flags (like the root layout) stay static.
const getFlagUser = async (
	flags: featureflags.FeatureFlagName[],
): Promise<featureflags.FlagUser | null> => {
	if (!flags.some(featureflags.isUserScopedFeature)) return null;

	const session = await getSession();
	if (!session) return null;

	const [role = DEFAULT_ROLE] = parseRoles(session.user.role);
	return { id: session.user.id, role };
};

export async function FeatureFlag({
	featureFlag,
	children,
}: {
	featureFlag: featureflags.FeatureFlagName | featureflags.FeatureFlagName[];
	children: ReactNode;
}) {
	const flags = Array.isArray(featureFlag) ? featureFlag : [featureFlag];
	const user = await getFlagUser(flags);

	return flags.every((flag) => featureflags.canViewFeature(flag, user))
		? children
		: null;
}
