import { cn } from "@/lib/utils";

import { CodeBlock } from "@/components/ui/custom/code-block";
import { Icons } from "@/components/utils/icons";
import { Button } from "@/components/ui/button";
import { CLink } from "@/components/utils/clink";

type THome = {
	className?: string;
	props?: React.ComponentPropsWithoutRef<"div">;
};
const code = `bun create bunext@latest`;

export function Home({ className, props }: THome) {
	return (
		<div
			className={cn(
				"container flex min-h-screen flex-col place-items-center items-center justify-center gap-4 align-middle",
				className,
			)}
			{...props}
		>
			<div className="flex flex-col items-center justify-center gap-1">
				<CodeBlock code={code} language="bash" />
				<div className="flex flex-wrap items-center">
					<Button variant={"ghost"} asChild>
						<CLink href="https://github.com/ardzero/bunext">
							<Icons.github /> GitHub
						</CLink>
					</Button>
					<Button variant={"ghost"} asChild>
						<CLink href="/docs">Docs</CLink>
					</Button>
				</div>
			</div>
		</div>
	);
}
