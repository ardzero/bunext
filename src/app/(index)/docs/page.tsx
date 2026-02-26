import { Metadata } from "next";
import { getCustomMetaData } from "@/lib/utils/metadata";

// always use this function when exporting metadata else open graph data gets overriden
export const metadata: Metadata = getCustomMetaData({
	title: "Docs",
	description: "Docs/Component Examples for Bunext",
	useFileOgImage: true,
});

import { ComponentExample } from "@/components/docs/component-example";
import { CbSamples } from "@/components/docs/cb-samples";
import { TestCard } from "./TestCard";

export default function Page() {
	// Simulate a production error

	return (
		<main className="container mx-auto">
			<div className="flex flex-col gap-16">
				<ComponentExample />
				<CbSamples />
			</div>
			<div className="flex flex-col items-center gap-8 py-12">
				<h1 className="text-4xl font-bold">Scroll Intersection Example</h1>

				{Array.from({ length: 20 }).map((_, i) => (
					<TestCard key={i} index={i} />
				))}
			</div>
		</main>
	);
}
