import { ThemeProvider } from "@/components/providers/theme-provider";

export function RootProvider({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			{/* <NuqsAdapter> */}
			<ThemeProvider disableTransitionOnChange>
				{children}
				{/* <Toaster /> */}
			</ThemeProvider>
			{/* </NuqsAdapter> */}
		</>
	);
}
