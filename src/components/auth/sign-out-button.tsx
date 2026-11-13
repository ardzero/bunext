"use client";

import { useTransition } from "react";
import { Slot } from "radix-ui";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/utils/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { getAuthErrorMessage } from "./auth-error";

type SignOutButtonProps = React.ComponentProps<typeof Button> & {
	redirectTo?: string;
};

// Signs out, then goes to `redirectTo`. With `asChild` it renders as its child,
// e.g. <SignOutButton asChild><DropdownMenuItem>Sign out</DropdownMenuItem></SignOutButton>
const SignOutButton = ({
	asChild = false,
	redirectTo = "/",
	children = "Sign out",
	disabled,
	onClick,
	...props
}: SignOutButtonProps) => {
	const [isPending, startTransition] = useTransition();
	const Comp = asChild ? Slot.Root : Button;

	const handleSignOut = (event: React.MouseEvent<HTMLButtonElement>) => {
		onClick?.(event);
		if (event.defaultPrevented) return;

		startTransition(async () => {
			const { error } = await authClient.signOut();
			if (error) {
				toast.error(getAuthErrorMessage(error));
				return;
			}
			// full navigation drops every piece of client state from the session
			window.location.assign(redirectTo);
		});
	};

	return (
		<Comp
			data-slot="sign-out-button"
			disabled={disabled || isPending}
			aria-disabled={disabled || isPending || undefined}
			aria-busy={isPending || undefined}
			onClick={handleSignOut}
			{...props}
		>
			{isPending && <Spinner />}
			<Slot.Slottable>{children}</Slot.Slottable>
		</Comp>
	);
};

export { SignOutButton };
