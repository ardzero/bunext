import { ComponentExample } from "@/components/component-example";
import { CbSamples } from "@/components/cb-samples";

export default function Page() {
	return (
		<div className="flex flex-col gap-16">
			<ComponentExample />
			<CbSamples />
		</div>
	);
}