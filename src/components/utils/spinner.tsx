import { cn } from "@/lib/utils";
import { Icons } from "@/components/utils/icons";

type SpinnerProps = React.ComponentProps<"svg">;

const Spinner = ({ className, ...props }: SpinnerProps) => (
	<Icons.spinner
		role="status"
		aria-label="Loading"
		data-slot="spinner"
		className={cn("size-4 animate-spin", className)}
		{...props}
	/>
);

export { Spinner };
