"use client";

import type * as React from "react";
import type { Theme } from "@/types";

import { FEATURE_FLAGS } from "@/lib/utils/featureFlags";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	const defaultTheme = FEATURE_FLAGS.DEFAULT_THEME as Theme;
	if (!FEATURE_FLAGS.NEXT_THEME) return <>{children}</>;
	return (
		<NextThemesProvider
			defaultTheme={defaultTheme}
			enableSystem={defaultTheme === "system"}
			attribute="class"
			disableTransitionOnChange
			enableColorScheme={false}
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
}
