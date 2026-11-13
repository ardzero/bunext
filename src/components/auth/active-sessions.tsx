"use client";

import { useState, useTransition } from "react";
import { MonitorIcon, SmartphoneIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { getAuthErrorMessage } from "./auth-error";

type SessionItem = {
	id: string;
	token: string;
	userAgent?: string | null;
	ipAddress?: string | null;
	updatedAt: Date | string;
	createdAt: Date | string;
};

type ParsedDevice = { browser: string; os: string; isMobile: boolean };

const getBrowser = (userAgent: string) => {
	if (/Edg\//.test(userAgent)) return "Edge";
	if (/Chrome\//.test(userAgent)) return "Chrome";
	if (/Firefox\//.test(userAgent)) return "Firefox";
	if (/Safari\//.test(userAgent)) return "Safari";
	return "Unknown browser";
};

const getOs = (userAgent: string) => {
	if (/Windows/.test(userAgent)) return "Windows";
	if (/iPhone|iPad/.test(userAgent)) return "iOS";
	if (/Mac OS/.test(userAgent)) return "macOS";
	if (/Android/.test(userAgent)) return "Android";
	if (/Linux/.test(userAgent)) return "Linux";
	return "Unknown device";
};

const parseUserAgent = (userAgent?: string | null): ParsedDevice => {
	const value = userAgent ?? "";
	const os = getOs(value);
	return {
		browser: getBrowser(value),
		os,
		isMobile: os === "iOS" || os === "Android",
	};
};

type ActiveSessionsProps = React.ComponentProps<typeof Card> & {
	sessions: SessionItem[];
	currentSessionId: string;
};

const ActiveSessions = ({
	sessions,
	currentSessionId,
	className,
	...props
}: ActiveSessionsProps) => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [pendingToken, setPendingToken] = useState<string | null>(null);
	const dateFormatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});

	const sortedSessions = [...sessions].sort(
		(a, b) =>
			Number(b.id === currentSessionId) - Number(a.id === currentSessionId),
	);
	const hasOtherSessions = sessions.some(
		(session) => session.id !== currentSessionId,
	);

	const handleRevoke = (token: string, deviceLabel: string) =>
		startTransition(async () => {
			setPendingToken(token);
			const { error } = await authClient.revokeSession({ token });
			setPendingToken(null);
			if (error) {
				toast.error(getAuthErrorMessage(error));
				return;
			}
			toast.success(`Signed out ${deviceLabel}`);
			router.refresh();
		});

	return (
		<Card data-slot="active-sessions" className={cn(className)} {...props}>
			<CardHeader>
				<CardTitle>Active sessions</CardTitle>
				<CardDescription>Devices where you&apos;re signed in.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<ul className="flex flex-col divide-y">
					{sortedSessions.map((session) => {
						const device = parseUserAgent(session.userAgent);
						const deviceLabel = `${device.browser} on ${device.os}`;
						const DeviceIcon = device.isMobile ? SmartphoneIcon : MonitorIcon;
						const isCurrent = session.id === currentSessionId;
						const isItemPending = isPending && pendingToken === session.token;
						const lastActive = new Date(session.updatedAt);

						return (
							<li
								key={session.id}
								className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
							>
								<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
									<DeviceIcon aria-hidden="true" className="size-4" />
								</div>
								<div className="flex min-w-0 flex-1 flex-col">
									<div className="flex min-w-0 flex-wrap items-center gap-2">
										<span className="min-w-0 truncate font-medium">
											{deviceLabel}
										</span>
										{isCurrent && (
											<Badge variant="secondary">This device</Badge>
										)}
									</div>
									{session.ipAddress && (
										<span className="truncate text-muted-foreground">
											{session.ipAddress}
										</span>
									)}
									<span className="truncate text-muted-foreground">
										Last active{" "}
										<time
											dateTime={lastActive.toISOString()}
											suppressHydrationWarning
										>
											{dateFormatter.format(lastActive)}
										</time>
									</span>
								</div>
								{!isCurrent && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										aria-label={`Sign out ${deviceLabel}`}
										aria-busy={isItemPending || undefined}
										disabled={isPending}
										onClick={() => handleRevoke(session.token, deviceLabel)}
									>
										{isItemPending && <Spinner />}
										Sign out
									</Button>
								)}
							</li>
						);
					})}
				</ul>
				{!hasOtherSessions && (
					<p className="text-sm text-muted-foreground">
						No other active sessions.
					</p>
				)}
			</CardContent>
		</Card>
	);
};

export { ActiveSessions };
