import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function RootProvider({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			{/* <NuqsAdapter> */}
			<ThemeProvider disableTransitionOnChange>
				<TooltipProvider>{children}</TooltipProvider>
				{/* <Toaster /> */}
			</ThemeProvider>
			{/* </NuqsAdapter> */}
		</>
	);
}
