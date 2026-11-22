"use client";

import { createContext, use, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/utils/icons";
import { Spinner } from "@/components/utils/spinner";
import { authClient } from "@/lib/auth/auth-client";
import type { ProviderId } from "@/lib/auth/provider-ids";
import { cn } from "@/lib/utils";
import { getAuthErrorMessage } from "./auth-error";

type SocialProvider = { id: ProviderId; label: string };

type IconProps = React.ComponentProps<"svg">;

const DiscordIcon = (props: IconProps) => (
	<svg role="img" viewBox="0 0 24 24" fill="currentColor" {...props}>
		<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
	</svg>
);

export const PROVIDER_ICONS: Record<
	ProviderId,
	(props: IconProps) => React.ReactNode
> = {
	google: (props) => <Icons.google {...props} />,
	discord: DiscordIcon,
};

type SocialButtonsContextValue = {
	pendingProvider: ProviderId | null;
	setPendingProvider: (provider: ProviderId | null) => void;
};

const SocialButtonsContext = createContext<SocialButtonsContextValue | null>(
	null,
);

type SocialButtonsProps = React.ComponentProps<"div"> & {
	providers: SocialProvider[];
	redirectTo: string;
	// path that receives `?error=` when the provider flow fails
	errorRedirectTo?: string;
};

// One SocialButton per enabled provider. Renders nothing (children included,
// e.g. the "or" separator) when no provider is enabled.
const SocialButtons = ({
	providers,
	redirectTo,
	errorRedirectTo,
	className,
	children,
	...props
}: SocialButtonsProps) => {
	const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(
		null,
	);
	if (providers.length === 0) return null;

	return (
		<SocialButtonsContext value={{ pendingProvider, setPendingProvider }}>
			<div
				data-slot="social-buttons"
				className={cn("flex flex-col gap-2", className)}
				{...props}
			>
				{providers.map((provider) => (
					<SocialButton
						key={provider.id}
						provider={provider}
						redirectTo={redirectTo}
						errorRedirectTo={errorRedirectTo}
					/>
				))}
			</div>
			{children}
		</SocialButtonsContext>
	);
};

type SocialButtonProps = Omit<
	React.ComponentProps<typeof Button>,
	"onClick"
> & {
	provider: SocialProvider;
	redirectTo: string;
	errorRedirectTo?: string;
};

// Starts the OAuth flow. Inside SocialButtons it disables its siblings while pending.
const SocialButton = ({
	provider,
	redirectTo,
	errorRedirectTo,
	className,
	disabled,
	...props
}: SocialButtonProps) => {
	const group = use(SocialButtonsContext);
	const [isPending, startTransition] = useTransition();
	const Icon = PROVIDER_ICONS[provider.id];
	const isGroupPending = Boolean(group?.pendingProvider);

	const handleSignIn = () =>
		startTransition(async () => {
			group?.setPendingProvider(provider.id);
			const { error } = await authClient.signIn.social({
				provider: provider.id,
				callbackURL: redirectTo,
				errorCallbackURL: errorRedirectTo,
			});
			// on success the browser is already navigating to the provider
			if (!error) return;
			group?.setPendingProvider(null);
			toast.error(getAuthErrorMessage(error));
		});

	return (
		<Button
			type="button"
			variant="outline"
			size="lg"
			data-slot="social-button"
			data-provider={provider.id}
			className={cn("w-full", className)}
			disabled={disabled || isPending || isGroupPending}
			aria-busy={isPending || undefined}
			onClick={handleSignIn}
			{...props}
		>
			{isPending ? <Spinner /> : <Icon aria-hidden="true" />}
			Continue with {provider.label}
		</Button>
	);
};

export { SocialButtons, SocialButton, type SocialProvider };
