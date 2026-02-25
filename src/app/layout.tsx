import type { Metadata, Viewport } from "next";
import { siteMetaData, viewportData } from "@/lib/utils/metadata";
// metadata
export const metadata: Metadata = siteMetaData;
export const viewport: Viewport = viewportData;
// css
import "@/styles/globals.css";
// utilities
import { cn } from "@/lib/utils";
import { fonts } from "@/styles/fonts";
// providers
import { RootProvider } from "@/components/providers/root-provider";
// components
import { ModeToggle } from "@/components/utils/ModeToggle";
import { FeatureFlag } from "@/components/utils/featureFlag";
import { ScrollToTopButton } from "@/components/utils/TopButton";
import { ErrorSimulator } from "@/components/examples/error-sim";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={cn("font-sans", fonts)}>
				<RootProvider>
					<ErrorSimulator />
					{children}
					{/* checks if theme and theme button feature flags are enabled */}
					<FeatureFlag featureFlag={["NEXT_THEME", "THEME_BUTTON"]}>
						<ModeToggle
							className="fixed bottom-3 left-3 z-50"
							iconClassName="size-[11px]"
						/>
					</FeatureFlag>
					<ScrollToTopButton className="fixed right-4 bottom-4 z-50" />
				</RootProvider>
			</body>
		</html>
	);
}
