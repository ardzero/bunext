"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/utils/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { AuthError } from "./auth-error";
import { FORGOT_PASSWORD_PATH, signInHref } from "./auth-paths";
import { PasswordInput } from "./password-input";
import { PASSWORD_MIN_LENGTH, passwordSchema } from "./schemas";
import { useAuthForm } from "./use-auth-form";

const resetPasswordSchema = z
	.object({
		newPassword: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: "Passwords don't match.",
		path: ["confirmPassword"],
	});

type ResetPasswordFormProps = Omit<React.ComponentProps<"form">, "onSubmit"> & {
	// from the `?token=` param of the reset link; the page reads it
	token: string | null;
	// from the `?error=` param, e.g. INVALID_TOKEN for an expired or used link
	error?: string | null;
};

type InvalidLinkProps = React.ComponentProps<"div"> & { code: string };

// recovery state for a missing, expired or already-used link
const ResetLinkInvalid = ({ code, className, ...props }: InvalidLinkProps) => (
	<div
		data-slot="reset-password-invalid"
		className={cn("flex flex-col gap-4", className)}
		{...props}
	>
		<AuthError code={code} />
		<Button asChild size="lg">
			<Link href={FORGOT_PASSWORD_PATH}>Request a new link</Link>
		</Button>
	</div>
);

const ResetPasswordForm = ({
	token,
	error,
	className,
	...props
}: ResetPasswordFormProps) => {
	const router = useRouter();
	const [tokenError, setTokenError] = useState<string | null>(null);

	const form = useAuthForm({
		schema: resetPasswordSchema,
		onSubmit: async ({ newPassword }) => {
			const { error: resetError } = await authClient.resetPassword({
				newPassword,
				token: token ?? "",
			});

			if (resetError?.code === "INVALID_TOKEN") {
				setTokenError(resetError.code);
				return;
			}
			if (resetError) {
				form.setAuthError(resetError);
				return;
			}

			toast.success("Password updated. Sign in with your new password.");
			router.push(signInHref());
		},
	});

	const invalidCode = tokenError ?? error ?? (token ? null : "INVALID_TOKEN");
	if (invalidCode)
		return <ResetLinkInvalid code={invalidCode} className={className} />;

	return (
		<form
			noValidate
			data-slot="reset-password-form"
			aria-busy={form.isPending || undefined}
			className={cn("flex flex-col gap-4", className)}
			onSubmit={form.handleSubmit}
			{...props}
		>
			<FieldGroup className="gap-4">
				<Field
					data-invalid={Boolean(form.fieldErrors.newPassword) || undefined}
				>
					<FieldLabel htmlFor={form.fieldId("newPassword")}>
						New password
					</FieldLabel>
					<PasswordInput
						autoComplete="new-password"
						disabled={form.isPending}
						{...form.getFieldProps("newPassword")}
					/>
					<FieldDescription>
						At least {PASSWORD_MIN_LENGTH} characters.
					</FieldDescription>
					<FieldError {...form.getErrorProps("newPassword")} />
				</Field>
				<Field
					data-invalid={Boolean(form.fieldErrors.confirmPassword) || undefined}
				>
					<FieldLabel htmlFor={form.fieldId("confirmPassword")}>
						Confirm password
					</FieldLabel>
					<PasswordInput
						autoComplete="new-password"
						disabled={form.isPending}
						{...form.getFieldProps("confirmPassword")}
					/>
					<FieldError {...form.getErrorProps("confirmPassword")} />
				</Field>
			</FieldGroup>
			<AuthError>{form.formError}</AuthError>
			<Button type="submit" size="lg" disabled={form.isPending}>
				{form.isPending && <Spinner />}
				Update password
			</Button>
		</form>
	);
};

export { ResetPasswordForm, ResetLinkInvalid };
