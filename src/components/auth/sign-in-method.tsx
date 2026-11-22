"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import type { SignInMethod } from "./auth-paths";

const SIGN_IN_METHODS = [
	"password",
	"magic-link",
] as const satisfies SignInMethod[];

// the chosen method lives in `?method=` so refresh and back keep it
const useSignInMethod = () =>
	useQueryState(
		"method",
		parseAsStringLiteral(SIGN_IN_METHODS).withDefault("password"),
	);

type SignInMethodPanelProps = {
	method: SignInMethod;
	children: React.ReactNode;
};

// renders its children only while `method` is selected
const SignInMethodPanel = ({ method, children }: SignInMethodPanelProps) => {
	const [selectedMethod] = useSignInMethod();
	if (selectedMethod !== method) return null;
	return children;
};

type SignInMethodToggleProps = Omit<
	React.ComponentProps<typeof Button>,
	"onClick"
>;

// "Email me a sign-in link" / "Use password instead"
const SignInMethodToggle = ({
	variant = "ghost",
	...props
}: SignInMethodToggleProps) => {
	const [selectedMethod, setSelectedMethod] = useSignInMethod();
	const isPassword = selectedMethod === "password";

	const handleToggle = () =>
		setSelectedMethod(isPassword ? "magic-link" : null, { history: "push" });

	return (
		<Button
			type="button"
			variant={variant}
			data-slot="sign-in-method-toggle"
			onClick={handleToggle}
			{...props}
		>
			{isPassword ? "Email me a sign-in link" : "Use password instead"}
		</Button>
	);
};

export { SignInMethodPanel, SignInMethodToggle, useSignInMethod };
