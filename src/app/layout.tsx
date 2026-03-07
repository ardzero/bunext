import type { Metadata, Viewport } from "next";
import {
	siteMetaData,
	viewportData,
	getSiteJsonLd,
} from "@/lib/utils/metadata";
// metadata
export const metadata: Metadata = siteMetaData;
export const viewport: Viewport = viewportData;
// css
import "@/styles/globals.css";
import "@/styles/scroll-fade.css";
// utilities
import { cn } from "@/lib/utils";
import { fonts } from "@/styles/fonts";
// providers
import { RootProvider } from "@/components/providers/root-provider";
// components
import { JsonLd } from "@/components/utils/JsonLd";
import { FeatureFlag } from "@/components/utils/featureFlag";
import { ModeToggle } from "@/components/utils/ModeToggle";
import { ScrollToTopButton } from "@/components/utils/TopButton";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<JsonLd data={getSiteJsonLd()} />
			</head>
			<body
				className={cn("flex min-h-screen w-full flex-col font-sans", fonts)}
			>
				<RootProvider>
					<main className="flex-1">{children}</main>
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
