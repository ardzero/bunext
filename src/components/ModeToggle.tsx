"use client";

import { LaptopIcon, Moon, Sun } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { motion } from "motion/react";

const buttonClassName =
	"relative z-10 flex flex-1 min-w-0 flex-col items-center justify-center p-2 hover:text-accent-foreground cursor-pointer transition-colors";

const THEME_INDICATOR_POSITION = {
	light: "0%",
	dark: "33.333%",
	system: "66.666%",
} as const;
type ThemeKey = keyof typeof THEME_INDICATOR_POSITION;

export function ModeToggle({
	className,
	iconClassName,
}: {
	className?: string;
	iconClassName?: string;
}) {
	const { theme, setTheme } = useTheme();
	const resolvedTheme = (theme ?? "system") as ThemeKey;
	// indicator position from left side
	const left = THEME_INDICATOR_POSITION[resolvedTheme];

	return (
		<RadioGroup
			value={theme ?? "system"}
			defaultValue="system"
			className={cn(
				"relative flex w-fit min-w-min gap-0 overflow-hidden rounded-md bg-popover backdrop-blur-2xl",
				className,
			)}
		>
			<motion.div
				className="absolute inset-y-0 w-1/3 bg-foreground/10"
				initial={false}
				animate={{ left }}
				transition={{ duration: 0.2, ease: "easeOut" }}
			/>
			<div className="relative flex min-w-0 flex-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<Label
							htmlFor="light"
							className={buttonClassName}
							onClick={() => setTheme("light")}
						>
							<RadioGroupItem
								value="light"
								id="light"
								className="sr-only!"
								aria-label="light theme"
							/>
							<Sun className={cn("size-4", iconClassName)} />
						</Label>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						<p>Light</p>
					</TooltipContent>
				</Tooltip>
			</div>
			<div className="relative flex min-w-0 flex-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<Label
							htmlFor="dark"
							className={buttonClassName}
							onClick={() => setTheme("dark")}
						>
							<RadioGroupItem
								value="dark"
								id="dark"
								className="sr-only!"
								aria-label="dark theme"
							/>
							<Moon className={cn("size-4", iconClassName)} />
						</Label>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						<p>Dark</p>
					</TooltipContent>
				</Tooltip>
			</div>
			<div className="relative flex min-w-0 flex-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<Label
							htmlFor="system"
							className={buttonClassName}
							onClick={() => setTheme("system")}
						>
							<RadioGroupItem
								value="system"
								id="system"
								className="sr-only!"
								aria-label="system theme"
							/>
							<LaptopIcon className={cn("size-4", iconClassName)} />
						</Label>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						<p>System</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</RadioGroup>
	);
}
