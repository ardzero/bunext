"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/utils/spinner";
import { authClient } from "@/lib/auth/auth-client";
import type { ProviderId } from "@/lib/auth/provider-ids";
import { cn } from "@/lib/utils";
import { AuthError, getAuthErrorMessage } from "./auth-error";
import { PROVIDER_ICONS, type SocialProvider } from "./social-buttons";

const ACCOUNT_PATH = "/account";

type LinkedAccount = { id: string; providerId: string; accountId: string };

type ConnectedAccountsProps = React.ComponentProps<typeof Card> & {
	providers: SocialProvider[];
	accounts: LinkedAccount[];
	// error code from the `?error=` query param after a failed link
	error?: string | null;
};

const ConnectedAccounts = ({
	providers,
	accounts,
	error,
	className,
	...props
}: ConnectedAccountsProps) => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(
		null,
	);

	if (providers.length === 0) return null;

	const isOnlyAccount = accounts.length <= 1;

	const handleConnect = (provider: SocialProvider) =>
		startTransition(async () => {
			setPendingProvider(provider.id);
			const { error: linkError } = await authClient.linkSocial({
				provider: provider.id,
				callbackURL: ACCOUNT_PATH,
				errorCallbackURL: ACCOUNT_PATH,
			});
			// on success the browser is already navigating to the provider
			if (!linkError) return;
			setPendingProvider(null);
			toast.error(getAuthErrorMessage(linkError));
		});

	const handleDisconnect = (provider: SocialProvider, account: LinkedAccount) =>
		startTransition(async () => {
			setPendingProvider(provider.id);
			const { error: unlinkError } = await authClient.unlinkAccount({
				accountId: account.id,
			});
			setPendingProvider(null);
			if (unlinkError) {
				toast.error(getAuthErrorMessage(unlinkError));
				return;
			}
			toast.success(`${provider.label} disconnected`);
			router.refresh();
		});

	return (
		<Card data-slot="connected-accounts" className={cn(className)} {...props}>
			<CardHeader>
				<CardTitle>Connected accounts</CardTitle>
				<CardDescription>Providers you can use to sign in.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<AuthError code={error} />
				<ul className="flex flex-col divide-y">
					{providers.map((provider) => {
						const Icon = PROVIDER_ICONS[provider.id];
						const account = accounts.find(
							(item) => item.providerId === provider.id,
						);
						const isRowPending = isPending && pendingProvider === provider.id;
						const isDisabled = isPending || Boolean(pendingProvider);

						return (
							<li
								key={provider.id}
								data-provider={provider.id}
								className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
							>
								<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
									<Icon aria-hidden="true" className="size-4" />
								</div>
								<div className="flex min-w-0 flex-1 flex-col">
									<span className="truncate font-medium">{provider.label}</span>
									<span className="truncate text-muted-foreground">
										{account ? "Connected" : "Not connected"}
									</span>
									{account && isOnlyAccount && (
										<span className="text-xs text-muted-foreground">
											This is your only sign-in method.
										</span>
									)}
								</div>
								{account ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										aria-label={`Disconnect ${provider.label}`}
										aria-busy={isRowPending || undefined}
										disabled={isDisabled || isOnlyAccount}
										onClick={() => handleDisconnect(provider, account)}
									>
										{isRowPending && <Spinner />}
										Disconnect
									</Button>
								) : (
									<Button
										type="button"
										variant="outline"
										size="sm"
										aria-label={`Connect ${provider.label}`}
										aria-busy={isRowPending || undefined}
										disabled={isDisabled}
										onClick={() => handleConnect(provider)}
									>
										{isRowPending && <Spinner />}
										Connect
									</Button>
								)}
							</li>
						);
					})}
				</ul>
			</CardContent>
		</Card>
	);
};

export { ConnectedAccounts };
