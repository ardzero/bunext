import Link from "next/link";
import { UserButton } from "@/components/auth/user-button";
import { requireSession } from "@/lib/auth/session";

const NAV_LINKS = [
	{ href: "/dashboard", label: "Dashboard" },
	{ href: "/account", label: "Account" },
];

// Signed-in area. Every page below still calls requireSession()/requireRole()
// itself, because layouts don't re-render on client navigation.
const AppLayout = async ({ children }: { children: React.ReactNode }) => {
	await requireSession();

	return (
		<div className="flex min-h-svh flex-col">
			<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
				<div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
					<nav
						aria-label="Main"
						className="flex min-w-0 items-center gap-4 text-sm"
					>
						<Link
							href="/"
							className="rounded-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							Bunext
						</Link>
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
							>
								{link.label}
							</Link>
						))}
					</nav>
					<UserButton />
				</div>
			</header>
			<div className="container mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-8">
				{children}
			</div>
		</div>
	);
};

export default AppLayout;
