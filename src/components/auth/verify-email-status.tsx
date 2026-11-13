"use client";

import { useState } from "react";
import { CircleCheckIcon } from "lucide-react";
import Link from "next/link";
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
import { verifyEmailHref } from "./auth-paths";
import {
	CheckEmail,
	CheckEmailActions,
	CheckEmailDescription,
	CheckEmailTitle,
	ResendButton,
} from "./check-email";
import { emailSchema } from "./schemas";
import { useAuthForm } from "./use-auth-form";

export type VerifyEmailState = "verified" | "error" | "unverified";

type VerifyEmailStatusProps = React.ComponentProps<"div"> & {
	status: VerifyEmailState;
	redirectTo: string;
	// error code from the verification link, e.g. TOKEN_EXPIRED or INVALID_TOKEN
	error?: string | null;
	// the signed-in user's email, when known
	email?: string | null;
};

const resendSchema = z.object({ email: emailSchema });

type ResendVerificationFormProps = Omit<
	React.ComponentProps<"form">,
	"onSubmit"
> & {
	redirectTo: string;
};

// asks for the address when nobody is signed in
const ResendVerificationForm = ({
	redirectTo,
	className,
	...props
}: ResendVerificationFormProps) => {
	const [sentTo, setSentTo] = useState<string | null>(null);

	const form = useAuthForm({
		schema: resendSchema,
		onSubmit: async ({ email }) => {
			const { error } = await authClient.sendVerificationEmail({
				email,
				callbackURL: verifyEmailHref(redirectTo),
			});
			if (error?.status === 429) {
				form.setAuthError(error);
				return;
			}
			setSentTo(email);
		},
	});

	if (sentTo) {
		return (
			<CheckEmailDescription role="status">
				If <strong>{sentTo}</strong> needs verifying, a new link is on its way.
			</CheckEmailDescription>
		);
	}

	return (
		<form
			noValidate
			data-slot="resend-verification-form"
			className={cn("flex w-full flex-col gap-3 text-left", className)}
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
						disabled={form.isPending}
						{...form.getFieldProps("email")}
					/>
					<FieldError {...form.getErrorProps("email")} />
				</Field>
			</FieldGroup>
			<AuthError>{form.formError}</AuthError>
			<Button type="submit" variant="outline" disabled={form.isPending}>
				{form.isPending && <Spinner />}
				Send a new link
			</Button>
		</form>
	);
};

// Landing page states for the email verification link.
const VerifyEmailStatus = ({
	status,
	redirectTo,
	error,
	email,
	className,
	...props
}: VerifyEmailStatusProps) => {
	const handleResend = () =>
		authClient.sendVerificationEmail({
			email: email ?? "",
			callbackURL: verifyEmailHref(redirectTo),
		});

	const resendAction = email ? (
		<ResendButton onResend={handleResend} />
	) : (
		<ResendVerificationForm redirectTo={redirectTo} />
	);

	if (status === "verified") {
		return (
			<div
				data-slot="verify-email-status"
				data-status={status}
				role="status"
				className={cn(
					"flex flex-col items-center gap-3 text-center",
					className,
				)}
				{...props}
			>
				<CircleCheckIcon aria-hidden="true" className="size-10 text-primary" />
				<h2 className="text-base font-medium">Email verified</h2>
				<p className="text-sm text-muted-foreground">Your account is ready.</p>
				<Button asChild size="lg" className="w-full">
					<Link href={redirectTo}>Continue</Link>
				</Button>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div
				data-slot="verify-email-status"
				data-status={status}
				className={cn("flex flex-col gap-4", className)}
				{...props}
			>
				<AuthError code={error ?? "INVALID_TOKEN"} />
				{resendAction}
			</div>
		);
	}

	return (
		<CheckEmail
			data-slot="verify-email-status"
			data-status={status}
			className={className}
			{...props}
		>
			<CheckEmailTitle>Check your email</CheckEmailTitle>
			<CheckEmailDescription>
				{email ? (
					<>
						Open the verification link we sent to <strong>{email}</strong>.
					</>
				) : (
					"Open the verification link we sent you."
				)}
			</CheckEmailDescription>
			<CheckEmailActions>{resendAction}</CheckEmailActions>
		</CheckEmail>
	);
};

export { VerifyEmailStatus, ResendVerificationForm };
