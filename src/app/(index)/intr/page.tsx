import { Metadata } from "next";
import { TestCard } from "./TestCard";

export const metadata: Metadata = {
	title: "Intr",
	description: "Intr",
	openGraph: {
		images: ["/intr/opengraph-image"],
	},
};

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
