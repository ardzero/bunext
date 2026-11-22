"use client";

import { useTransition } from "react";
import { MailCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/utils/spinner";
import { cn } from "@/lib/utils";
import { getAuthErrorMessage, type AuthErrorLike } from "./auth-error";
import { useCooldown } from "./use-cooldown";

const RESEND_COOLDOWN_SECONDS = 60;

type CheckEmailProps = React.ComponentProps<"div">;

// "Check your email" state shown after a link was sent. Compose with
// CheckEmailTitle, CheckEmailDescription and CheckEmailActions.
const CheckEmail = ({ className, children, ...props }: CheckEmailProps) => (
	<div
		data-slot="check-email"
		role="status"
		aria-live="polite"
		className={cn("flex flex-col items-center gap-3 text-center", className)}
		{...props}
	>
		<div className="flex size-10 items-center justify-center rounded-full bg-muted">
			<MailCheckIcon
				aria-hidden="true"
				className="size-5 text-muted-foreground"
			/>
		</div>
		{children}
	</div>
);

const CheckEmailTitle = ({
	className,
	...props
}: React.ComponentProps<"h2">) => (
	<h2
		data-slot="check-email-title"
		className={cn("text-base font-medium", className)}
		{...props}
	/>
);

const CheckEmailDescription = ({
	className,
	...props
}: React.ComponentProps<"p">) => (
	<p
		data-slot="check-email-description"
		className={cn(
			"text-sm text-balance text-muted-foreground [&_strong]:font-medium [&_strong]:break-all [&_strong]:text-foreground",
			className,
		)}
		{...props}
	/>
);

const CheckEmailActions = ({
	className,
	...props
}: React.ComponentProps<"div">) => (
	<div
		data-slot="check-email-actions"
		className={cn("flex w-full flex-col gap-2", className)}
		{...props}
	/>
);

type ResendResult = { error?: AuthErrorLike | null } | void;

type ResendButtonProps = Omit<
	React.ComponentProps<typeof Button>,
	"onClick"
> & {
	onResend: () => Promise<ResendResult>;
	cooldownSeconds?: number;
};

// Resends a link, then waits out a cooldown before it can be pressed again.
const ResendButton = ({
	onResend,
	cooldownSeconds = RESEND_COOLDOWN_SECONDS,
	disabled,
	children = "Resend email",
	variant = "outline",
	...props
}: ResendButtonProps) => {
	const [isPending, startTransition] = useTransition();
	const { secondsLeft, isCoolingDown, start } = useCooldown(cooldownSeconds);

	const handleResend = () =>
		startTransition(async () => {
			const result = await onResend();
			if (result?.error) {
				toast.error(getAuthErrorMessage(result.error));
				return;
			}
			start();
			toast.success("Email sent. Check your inbox.");
		});

	return (
		<Button
			type="button"
			variant={variant}
			disabled={disabled || isPending || isCoolingDown}
			onClick={handleResend}
			data-slot="resend-button"
			{...props}
		>
			{isPending && <Spinner />}
			{isCoolingDown ? `Resend in ${secondsLeft}s` : children}
		</Button>
	);
};

export {
	CheckEmail,
	CheckEmailTitle,
	CheckEmailDescription,
	CheckEmailActions,
	ResendButton,
};
