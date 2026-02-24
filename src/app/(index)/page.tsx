import { ComponentExample } from "@/components/examples/component-example";
import { CbSamples } from "@/components/examples/cb-samples";

export default function Page() {
	return (
		<div className="flex flex-col gap-16">
			<ComponentExample />
			<CbSamples />
		</div>
	);
}
