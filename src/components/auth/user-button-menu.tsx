"use client";

import {
	LaptopIcon,
	MoonIcon,
	ShieldIcon,
	SunIcon,
	UserIcon,
	LogOutIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";
import { UserAvatar } from "./user-avatar";

const THEMES = [
	{ value: "light", label: "Light", Icon: SunIcon },
	{ value: "dark", label: "Dark", Icon: MoonIcon },
	{ value: "system", label: "System", Icon: LaptopIcon },
] as const;

type UserButtonMenuProps = React.ComponentProps<typeof Button> & {
	user: { name: string; email: string; image?: string | null };
	roles: Role[];
	isAdmin: boolean;
	showThemeToggle: boolean;
};

const ThemeMenu = () => {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<SunIcon aria-hidden="true" className="dark:hidden" />
				<MoonIcon aria-hidden="true" className="hidden dark:block" />
				Theme
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
					{THEMES.map(({ value, label, Icon }) => (
						<DropdownMenuRadioItem key={value} value={value}>
							<Icon aria-hidden="true" />
							{label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

// keep the menu open while signing out so the pending state stays visible
const handleSignOutSelect = (event: Event) => event.preventDefault();

const UserButtonMenu = ({
	user,
	roles,
	isAdmin,
	showThemeToggle,
	className,
	...props
}: UserButtonMenuProps) => (
	<DropdownMenu>
		<DropdownMenuTrigger asChild>
			<Button
				variant="ghost"
				size="icon-lg"
				data-slot="user-button"
				aria-label={`Account menu for ${user.name || user.email}`}
				className={cn("rounded-full", className)}
				{...props}
			>
				<UserAvatar user={user} />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
			<DropdownMenuLabel className="flex items-center gap-2 py-2 text-foreground">
				<UserAvatar user={user} />
				<div className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-sm font-medium">
						{user.name || user.email}
					</span>
					<span className="truncate text-xs font-normal text-muted-foreground">
						{user.email}
					</span>
				</div>
				{roles.map((role) => (
					<Badge
						key={role}
						variant={role === "admin" ? "default" : "secondary"}
					>
						{role}
					</Badge>
				))}
			</DropdownMenuLabel>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuItem asChild>
					<Link href="/account">
						<UserIcon aria-hidden="true" />
						Account
					</Link>
				</DropdownMenuItem>
				{isAdmin && (
					<DropdownMenuItem asChild>
						<Link href="/admin">
							<ShieldIcon aria-hidden="true" />
							Admin
						</Link>
					</DropdownMenuItem>
				)}
				{showThemeToggle && <ThemeMenu />}
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<SignOutButton asChild>
				<DropdownMenuItem onSelect={handleSignOutSelect}>
					<LogOutIcon aria-hidden="true" />
					Sign out
				</DropdownMenuItem>
			</SignOutButton>
		</DropdownMenuContent>
	</DropdownMenu>
);

export { UserButtonMenu };
