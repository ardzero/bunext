"use client";

import { useState } from "react";
import { CheckIcon, CircleIcon } from "lucide-react";
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
import { AuthError, getAuthErrorMessage } from "./auth-error";
import { verifyEmailHref } from "./auth-paths";
import {
	CheckEmail,
	CheckEmailActions,
	CheckEmailDescription,
	CheckEmailTitle,
	ResendButton,
} from "./check-email";
import { PasswordInput } from "./password-input";
import {
	emailSchema,
	nameSchema,
	PASSWORD_MIN_LENGTH,
	passwordSchema,
} from "./schemas";
import { useAuthForm } from "./use-auth-form";

const signUpSchema = z.object({
	name: nameSchema,
	email: emailSchema,
	password: passwordSchema,
});

type PasswordRulesProps = React.ComponentProps<"ul"> & { password: string };

// password requirements, visible before the first submit
const PasswordRules = ({
	password,
	className,
	...props
}: PasswordRulesProps) => {
	const rules = [
		{
			label: `At least ${PASSWORD_MIN_LENGTH} characters`,
			isMet: password.length >= PASSWORD_MIN_LENGTH,
		},
	];

	return (
		<ul
			data-slot="password-rules"
			className={cn(
				"flex flex-col gap-1 text-sm text-muted-foreground",
				className,
			)}
			{...props}
		>
			{rules.map((rule) => (
				<li
					key={rule.label}
					data-met={rule.isMet}
					className="flex items-center gap-1.5 data-[met=true]:text-foreground"
				>
					{rule.isMet ? (
						<CheckIcon aria-hidden="true" className="size-3.5" />
					) : (
						<CircleIcon aria-hidden="true" className="size-3.5" />
					)}
					{rule.label}
					<span className="sr-only">{rule.isMet ? "(met)" : "(not met)"}</span>
				</li>
			))}
		</ul>
	);
};

type SignUpFormProps = Omit<React.ComponentProps<"form">, "onSubmit"> & {
	redirectTo: string;
};

const SignUpForm = ({ redirectTo, className, ...props }: SignUpFormProps) => {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
		string | null
	>(null);

	const form = useAuthForm({
		schema: signUpSchema,
		onSubmit: async ({ name, email, password }, formElement) => {
			const { data, error } = await authClient.signUp.email({
				name,
				email,
				password,
				callbackURL: verifyEmailHref(redirectTo),
			});

			if (error?.code?.startsWith("USER_ALREADY_EXISTS")) {
				form.setFieldError("email", getAuthErrorMessage(error), formElement);
				return;
			}
			if (error) {
				form.setAuthError(error);
				return;
			}

			// no session token means email verification is required
			if (!data?.token) {
				setPendingVerificationEmail(email);
				return;
			}

			router.push(redirectTo);
			router.refresh();
		},
	});

	const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) =>
		setPassword(event.target.value);

	const handleResendVerification = () =>
		authClient.sendVerificationEmail({
			email: pendingVerificationEmail ?? "",
			callbackURL: verifyEmailHref(redirectTo),
		});

	if (pendingVerificationEmail) {
		return (
			<CheckEmail data-slot="sign-up-form" className={className}>
				<CheckEmailTitle>Check your email</CheckEmailTitle>
				<CheckEmailDescription>
					We sent a verification link to{" "}
					<strong>{pendingVerificationEmail}</strong>. Open it to activate your
					account.
				</CheckEmailDescription>
				<CheckEmailActions>
					<ResendButton onResend={handleResendVerification} />
				</CheckEmailActions>
			</CheckEmail>
		);
	}

	const passwordProps = form.getFieldProps("password");
	const rulesId = `${passwordProps.id}-rules`;

	return (
		<form
			noValidate
			data-slot="sign-up-form"
			aria-busy={form.isPending || undefined}
			className={cn("flex flex-col gap-4", className)}
			onSubmit={form.handleSubmit}
			{...props}
		>
			<FieldGroup className="gap-4">
				<Field data-invalid={Boolean(form.fieldErrors.name) || undefined}>
					<FieldLabel htmlFor={form.fieldId("name")}>Name</FieldLabel>
					<Input
						autoComplete="name"
						disabled={form.isPending}
						{...form.getFieldProps("name")}
					/>
					<FieldError {...form.getErrorProps("name")} />
				</Field>
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
					<FieldLabel htmlFor={passwordProps.id}>Password</FieldLabel>
					<PasswordInput
						autoComplete="new-password"
						disabled={form.isPending}
						onChange={handlePasswordChange}
						{...passwordProps}
						aria-describedby={[rulesId, passwordProps["aria-describedby"]]
							.filter(Boolean)
							.join(" ")}
					/>
					<PasswordRules id={rulesId} password={password} />
					<FieldError {...form.getErrorProps("password")} />
				</Field>
			</FieldGroup>
			<AuthError>{form.formError}</AuthError>
			<Button type="submit" size="lg" disabled={form.isPending}>
				{form.isPending && <Spinner />}
				Create account
			</Button>
		</form>
	);
};

export { SignUpForm, PasswordRules };
