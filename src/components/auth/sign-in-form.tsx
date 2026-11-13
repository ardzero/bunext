"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { FORGOT_PASSWORD_PATH, verifyEmailHref } from "./auth-paths";
import {
	CheckEmail,
	CheckEmailActions,
	CheckEmailDescription,
	CheckEmailTitle,
	ResendButton,
} from "./check-email";
import { PasswordInput } from "./password-input";
import { emailSchema } from "./schemas";
import { useAuthForm } from "./use-auth-form";

const signInSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Enter your password."),
});

type SignInFormProps = Omit<React.ComponentProps<"form">, "onSubmit"> & {
	redirectTo: string;
};

const SignInForm = ({ redirectTo, className, ...props }: SignInFormProps) => {
	const router = useRouter();
	const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

	const form = useAuthForm({
		schema: signInSchema,
		onSubmit: async ({ email, password }) => {
			const { error } = await authClient.signIn.email({
				email,
				password,
				callbackURL: redirectTo,
			});

			if (error?.code === "EMAIL_NOT_VERIFIED") {
				setUnverifiedEmail(email);
				return;
			}
			if (error) {
				form.setAuthError(error);
				return;
			}

			router.push(redirectTo);
			router.refresh();
		},
	});

	const handleResendVerification = () =>
		authClient.sendVerificationEmail({
			email: unverifiedEmail ?? "",
			callbackURL: verifyEmailHref(redirectTo),
		});

	const handleUseAnotherAccount = () => setUnverifiedEmail(null);

	if (unverifiedEmail) {
		return (
			<CheckEmail data-slot="sign-in-form" className={className}>
				<CheckEmailTitle>Verify your email</CheckEmailTitle>
				<CheckEmailDescription>
					We sent a verification link to <strong>{unverifiedEmail}</strong>.
					Open it to finish signing in.
				</CheckEmailDescription>
				<CheckEmailActions>
					<ResendButton onResend={handleResendVerification} />
					<Button
						type="button"
						variant="ghost"
						onClick={handleUseAnotherAccount}
					>
						Use another account
					</Button>
				</CheckEmailActions>
			</CheckEmail>
		);
	}

	return (
		<form
			noValidate
			data-slot="sign-in-form"
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
				<Field data-invalid={Boolean(form.fieldErrors.password) || undefined}>
					<div className="flex items-center justify-between gap-2">
						<FieldLabel htmlFor={form.fieldId("password")}>Password</FieldLabel>
						<Link
							href={FORGOT_PASSWORD_PATH}
							className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							Forgot password?
						</Link>
					</div>
					<PasswordInput
						autoComplete="current-password"
						disabled={form.isPending}
						{...form.getFieldProps("password")}
					/>
					<FieldError {...form.getErrorProps("password")} />
				</Field>
			</FieldGroup>
			<AuthError>{form.formError}</AuthError>
			<Button type="submit" size="lg" disabled={form.isPending}>
				{form.isPending && <Spinner />}
				Sign in
			</Button>
		</form>
	);
};

export { SignInForm };
