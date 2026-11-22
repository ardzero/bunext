"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/utils/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { AuthError } from "./auth-error";
import { RESET_PASSWORD_PATH } from "./auth-paths";
import {
	CheckEmail,
	CheckEmailActions,
	CheckEmailDescription,
	CheckEmailTitle,
	ResendButton,
} from "./check-email";
import { emailSchema } from "./schemas";
import { useAuthForm } from "./use-auth-form";

const forgotPasswordSchema = z.object({ email: emailSchema });

type ForgotPasswordFormProps = Omit<React.ComponentProps<"form">, "onSubmit">;

const ForgotPasswordForm = ({
	className,
	...props
}: ForgotPasswordFormProps) => {
	const [sentTo, setSentTo] = useState<string | null>(null);

	const requestReset = (email: string) =>
		authClient.requestPasswordReset({ email, redirectTo: RESET_PASSWORD_PATH });

	const form = useAuthForm({
		schema: forgotPasswordSchema,
		onSubmit: async ({ email }) => {
			const { error } = await requestReset(email);
			// only rate limiting is reported; the confirmation never reveals whether the account exists
			if (error?.status === 429) {
				form.setAuthError(error);
				return;
			}
			setSentTo(email);
		},
	});

	const handleResend = () => requestReset(sentTo ?? "");
	const handleChangeEmail = () => setSentTo(null);

	if (sentTo) {
		return (
			<CheckEmail data-slot="forgot-password-form" className={className}>
				<CheckEmailTitle>Check your email</CheckEmailTitle>
				<CheckEmailDescription>
					If an account exists for <strong>{sentTo}</strong>, we sent a link to
					reset the password. It expires in 1 hour.
				</CheckEmailDescription>
				<CheckEmailActions>
					<ResendButton onResend={handleResend} />
					<Button type="button" variant="ghost" onClick={handleChangeEmail}>
						Use a different email
					</Button>
				</CheckEmailActions>
			</CheckEmail>
		);
	}

	return (
		<form
			noValidate
			data-slot="forgot-password-form"
			aria-busy={form.isPending || undefined}
			className={cn("flex flex-col gap-4", className)}
			onSubmit={form.handleSubmit}
			{...props}
		>
			<FieldGroup className="gap-4">
				<Field data-invalid={Boolean(form.fieldErrors.email) || undefined}>
					<FieldLabel htmlFor={form.fieldId("email")}>Email</FieldLabel>
					<Input
						type="email"
						autoComplete="email"
						inputMode="email"
						placeholder="you@example.com"
						disabled={form.isPending}
						{...form.getFieldProps("email")}
					/>
					<FieldError {...form.getErrorProps("email")} />
				</Field>
			</FieldGroup>
			<AuthError>{form.formError}</AuthError>
			<Button type="submit" size="lg" disabled={form.isPending}>
				{form.isPending && <Spinner />}
				Send reset link
			</Button>
		</form>
	);
};

export { ForgotPasswordForm };
