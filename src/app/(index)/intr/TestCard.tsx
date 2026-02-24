"use client";
import { useIntersection } from "@/hooks/use-intersection";
import { cn } from "@/lib/utils";

type TTestCard = {
	className?: string;
	index: number;
};

export function TestCard({ className, index }: TTestCard) {
	const { ref, isInView } = useIntersection({ threshold: 0.2, once: true });
	return (
		<div
			ref={ref}
			className={cn(
				"w-full max-w-md rounded-lg bg-muted/45 p-6 shadow-lg transition-opacity duration-500",
				isInView
					? "motion-scale-in-[0.41] motion-blur-in-[60px] motion-translate-x-in-[2%] motion-translate-y-in-[111%] motion-delay-75"
					: "opacity-0",
				className,
			)}
		>
			<h2 className="mb-4 text-2xl font-semibold">Card {index + 1}</h2>
			<p className="text-muted-foreground">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
				tempfwfor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
				veniam.
			</p>
		</div>
	);
}
