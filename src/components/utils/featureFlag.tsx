// component to check feature flags before rendering a component
import * as featureflags from "@/lib/utils/featureFlags";
import { getUser } from "@/lib/utils/user";
import type { ReactNode } from "react";

export function FeatureFlag({
	featureFlag,
	children,
}: {
	featureFlag: featureflags.FeatureFlagName | featureflags.FeatureFlagName[];
	children: ReactNode;
}) {
	const user = getUser();

	if (Array.isArray(featureFlag)) {
		return featureFlag.every((flag) => featureflags.canViewFeature(flag, user))
			? children
			: null;
	}

	return featureflags.canViewFeature(featureFlag, user) ? children : null;
}
