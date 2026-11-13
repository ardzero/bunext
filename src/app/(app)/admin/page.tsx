import type { Metadata } from "next";
import { headers } from "next/headers";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth/auth";
import { parseRoles } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin" };

const USERS_PAGE_SIZE = 100;

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

const AdminPage = async () => {
	await requireRole("admin");

	const { users, total } = await auth.api.listUsers({
		query: {
			limit: USERS_PAGE_SIZE,
			sortBy: "createdAt",
			sortDirection: "desc",
		},
		headers: await headers(),
	});

	return (
		<>
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
				<p className="text-sm text-muted-foreground">
					Read-only list of users.
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Users</CardTitle>
					<CardDescription>
						Showing {users.length} of {total}, newest first.
					</CardDescription>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="w-full min-w-lg text-left text-sm">
						<thead className="text-muted-foreground">
							<tr className="border-b">
								<th scope="col" className="py-2 pr-4 font-medium">
									Name
								</th>
								<th scope="col" className="py-2 pr-4 font-medium">
									Email
								</th>
								<th scope="col" className="py-2 pr-4 font-medium">
									Role
								</th>
								<th scope="col" className="py-2 font-medium">
									Joined
								</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr key={user.id} className="border-b last:border-0">
									<td className="py-2 pr-4">{user.name || "—"}</td>
									<td className="py-2 pr-4">
										<span className="flex items-center gap-2">
											{user.email}
											{!user.emailVerified && (
												<Badge variant="outline">Unverified</Badge>
											)}
										</span>
									</td>
									<td className="py-2 pr-4">
										<span className="flex gap-1">
											{parseRoles(user.role).map((role) => (
												<Badge
													key={role}
													variant={role === "admin" ? "default" : "secondary"}
												>
													{role}
												</Badge>
											))}
										</span>
									</td>
									<td className="py-2 whitespace-nowrap">
										{dateFormatter.format(new Date(user.createdAt))}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</>
	);
};

export default AdminPage;
