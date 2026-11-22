import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { parseRoles } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

// Placeholder: replace with your product.
const DashboardPage = async () => {
	const { user } = await requireSession();

	return (
		<>
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Welcome{user.name ? `, ${user.name}` : ""}
				</h1>
				<p className="text-sm text-muted-foreground">
					You&apos;re signed in. Build your app here.
				</p>
			</div>
			<Card className="max-w-xl">
				<CardHeader>
					<CardTitle>Session</CardTitle>
					<CardDescription>
						Read on the server with requireSession().
					</CardDescription>
				</CardHeader>
				<CardContent>
					<dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
						<dt className="text-muted-foreground">Email</dt>
						<dd className="truncate">{user.email}</dd>
						<dt className="text-muted-foreground">Role</dt>
						<dd className="flex flex-wrap gap-1">
							{parseRoles(user.role).map((role) => (
								<Badge key={role} variant="secondary">
									{role}
								</Badge>
							))}
						</dd>
						<dt className="text-muted-foreground">Verified</dt>
						<dd>{user.emailVerified ? "Yes" : "No"}</dd>
					</dl>
				</CardContent>
			</Card>
		</>
	);
};

export default DashboardPage;
