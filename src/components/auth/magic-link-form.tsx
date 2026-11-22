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
import { signInHref } from "./auth-paths";
import {
	CheckEmail,
	CheckEmailActions,
	CheckEmailDescription,
	CheckEmailTitle,
	ResendButton,
} from "./check-email";
import { emailSchema } from "./schemas";
import { useAuthForm } from "./use-auth-form";

const magicLinkSchema = z.object({
	email: emailSchema,
});

type MagicLinkFormProps = Omit<React.ComponentProps<"form">, "onSubmit"> & {
	redirectTo: string;
};

const MagicLinkForm = ({
	redirectTo,
	className,
	...props
}: MagicLinkFormProps) => {
	const [sentTo, setSentTo] = useState<string | null>(null);

	// an expired or reused link lands back here with the magic-link form selected
	const requestLink = (email: string) =>
		authClient.signIn.magicLink({
			email,
			callbackURL: redirectTo,
			newUserCallbackURL: redirectTo,
			errorCallbackURL: signInHref(redirectTo, "magic-link"),
		});

	const form = useAuthForm({
		schema: magicLinkSchema,
		onSubmit: async ({ email }) => {
			const { error } = await requestLink(email);
			// only rate limiting is reported; the confirmation never reveals whether the account exists
			if (error?.status === 429) {
				form.setAuthError(error);
				return;
			}
			setSentTo(email);
		},
	});

	const handleResend = () => requestLink(sentTo ?? "");
	const handleChangeEmail = () => setSentTo(null);

	if (sentTo) {
		return (
			<CheckEmail data-slot="magic-link-form" className={className}>
				<CheckEmailTitle>Check your email</CheckEmailTitle>
				<CheckEmailDescription>
					If <strong>{sentTo}</strong> can sign in here, a sign-in link is on
					its way. It expires in 10 minutes and works once.
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
			data-slot="magic-link-form"
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
				Email me a sign-in link
			</Button>
		</form>
	);
};

export { MagicLinkForm };
