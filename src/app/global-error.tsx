"use client";
// https://nextjs.org/docs/app/building-your-application/routing/error-handling
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import "@/styles/globals.css";
import { Metadata } from "next";
import { siteData } from "@/lib/data/siteData";

export const metadata: Metadata = {
	title: `:( Error / ${siteData.name}`,
	description: `An Error Occurred :( // ${siteData.name}`,
};

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en" className="dark">
			<body>
				<div className="flex min-h-screen motion-blur-in-[50px] flex-col items-center justify-center">
					<h1 className="motion-preset-seesaw text-9xl font-bold">500</h1>
					<h2 className="text-2xl font-bold">
						{error.message || "Something went wrong!"}
					</h2>
					<div className="flex flex-wrap items-center justify-center gap-2">
						<p className="mt-2">We apologize for the inconvenience</p>
						{error.digest && (
							<code className="mt-2 rounded-md border bg-muted/50 p-2 text-sm">
								Error ID: {error.digest}
							</code>
						)}
					</div>
					<div className="flex flex-wrap items-center justify-center gap-4">
						<Button className="group mt-10" onClick={() => reset()}>
							<RefreshCcw
								className="-ms-1 opacity-60 transition-transform duration-500 group-hover:rotate-180"
								size={16}
								strokeWidth={2}
								aria-hidden="true"
							/>
							Refresh
						</Button>
					</div>
				</div>
			</body>
		</html>
	);
}
