"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
	autoComplete: "current-password" | "new-password";
};

const PasswordInput = ({
	className,
	disabled,
	...props
}: PasswordInputProps) => {
	const [isVisible, setIsVisible] = useState(false);

	const handleToggleVisibility = () => setIsVisible((visible) => !visible);

	return (
		<InputGroup data-slot="password-input" className={cn(className)}>
			<InputGroupInput
				type={isVisible ? "text" : "password"}
				disabled={disabled}
				spellCheck={false}
				autoCapitalize="none"
				{...props}
			/>
			<InputGroupAddon align="inline-end">
				<InputGroupButton
					size="icon-xs"
					aria-label={isVisible ? "Hide password" : "Show password"}
					aria-pressed={isVisible}
					aria-controls={props.id}
					disabled={disabled}
					onClick={handleToggleVisibility}
				>
					{isVisible ? (
						<EyeOffIcon aria-hidden="true" />
					) : (
						<EyeIcon aria-hidden="true" />
					)}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
};

export { PasswordInput };
