import { Metadata } from "next";
import { TestCard } from "./TestCard";
import { getCustomMetaData } from "@/lib/utils/metadata";

// always use this function when exporting metadata else open graph texts get overriden
export const metadata: Metadata = getCustomMetaData({
	title: "Intr",
	description: "Test page for scroll intersection",
	useFileOgImage: true,
});

export default function Page() {
	// Simulate a production error

	return (
		<main className="container mx-auto">
			<div className="flex flex-col items-center gap-8 py-12">
				<h1 className="text-4xl font-bold">Scroll Intersection Example</h1>

				{Array.from({ length: 20 }).map((_, i) => (
					<TestCard key={i} index={i} />
				))}
			</div>
		</main>
	);
}
