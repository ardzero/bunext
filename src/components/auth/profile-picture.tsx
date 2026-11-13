"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	refreshProviderAvatar,
	selectProviderAvatar,
} from "@/actions/provider-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/utils/spinner";
import type { ProviderId } from "@/lib/auth/provider-ids";
import { cn } from "@/lib/utils";
import type { SocialProvider } from "./social-buttons";
import { UserAvatar } from "./user-avatar";

type ProviderAvatar = { providerId: string; imageUrl: string };

type ProfilePictureProps = React.ComponentProps<typeof Card> & {
	user: { name: string; email: string; image?: string | null };
	// providers the user has connected
	providers: SocialProvider[];
	avatars: ProviderAvatar[];
};

type PendingAction = { providerId: ProviderId; kind: "select" | "refresh" };

const ProfilePicture = ({
	user,
	providers,
	avatars,
	className,
	...props
}: ProfilePictureProps) => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [pending, setPending] = useState<PendingAction | null>(null);

	if (providers.length === 0) return null;

	const handleAction = (
		provider: SocialProvider,
		kind: PendingAction["kind"],
	) =>
		startTransition(async () => {
			setPending({ providerId: provider.id, kind });
			const action =
				kind === "select" ? selectProviderAvatar : refreshProviderAvatar;
			const { error } = await action(provider.id);
			setPending(null);
			if (error) {
				toast.error(error);
				return;
			}
			toast.success(
				kind === "select"
					? `Using your ${provider.label} picture`
					: `${provider.label} picture updated`,
			);
			router.refresh();
		});

	return (
		<Card data-slot="profile-picture" className={cn(className)} {...props}>
			<CardHeader>
				<CardTitle>Profile picture</CardTitle>
				<CardDescription>
					Pick the picture from one of your connected accounts, or refresh it to
					pull the latest one.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col divide-y">
					{providers.map((provider) => {
						const imageUrl = avatars.find(
							(avatar) => avatar.providerId === provider.id,
						)?.imageUrl;
						const isInUse = Boolean(imageUrl) && imageUrl === user.image;
						const isRowPending = pending?.providerId === provider.id;

						return (
							<li
								key={provider.id}
								data-provider={provider.id}
								className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
							>
								<UserAvatar
									size="lg"
									user={{
										name: provider.label,
										email: user.email,
										image: imageUrl,
									}}
								/>
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<span className="truncate font-medium">{provider.label}</span>
									{isInUse && <Badge variant="secondary">In use</Badge>}
								</div>
								<div className="flex gap-2">
									{imageUrl && !isInUse && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											aria-label={`Use ${provider.label} picture`}
											aria-busy={
												(isRowPending && pending?.kind === "select") ||
												undefined
											}
											disabled={isPending}
											onClick={() => handleAction(provider, "select")}
										>
											{isRowPending && pending?.kind === "select" && (
												<Spinner />
											)}
											Use
										</Button>
									)}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										aria-label={`Refresh ${provider.label} picture`}
										aria-busy={
											(isRowPending && pending?.kind === "refresh") || undefined
										}
										disabled={isPending}
										onClick={() => handleAction(provider, "refresh")}
									>
										{isRowPending && pending?.kind === "refresh" && <Spinner />}
										{imageUrl ? "Refresh" : "Fetch"}
									</Button>
								</div>
							</li>
						);
					})}
				</ul>
			</CardContent>
		</Card>
	);
};

export { ProfilePicture };
