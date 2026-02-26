// CLink: Link for internal routes, <a target="_blank"> for external.
import { cn } from "@/lib/utils";
import Link, { type LinkProps } from "next/link";
import { forwardRef } from "react";

type TCLinkProps = {
	href: string;
	children: React.ReactNode;
	openNewTab?: boolean;
	className?: string;
} & React.ComponentPropsWithoutRef<"a"> &
	LinkProps;

export const CLink = forwardRef<HTMLAnchorElement, TCLinkProps>(
	({ children, href, openNewTab, className, ...rest }, ref) => {
		const isNewTab =
			openNewTab !== undefined
				? openNewTab
				: href && !href.startsWith("/") && !href.startsWith("#");

		if (!isNewTab)
			return (
				<Link ref={ref} href={href} className={className} {...rest}>
					{children}
				</Link>
			);

		return (
			<a
				ref={ref}
				target="_blank"
				rel="noopener noreferrer"
				href={href}
				{...rest}
				className={cn(className, "cursor-newtab")}
			>
				{children}
			</a>
		);
	},
);
CLink.displayName = "CLink";
