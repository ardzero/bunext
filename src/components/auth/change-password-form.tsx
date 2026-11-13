"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { AuthError, getAuthErrorMessage } from "./auth-error";
import { FORGOT_PASSWORD_PATH } from "./auth-paths";
import { PasswordInput } from "./password-input";
import { PASSWORD_MIN_LENGTH, passwordSchema } from "./schemas";
import { useAuthForm } from "./use-auth-form";

const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Enter your current password."),
		newPassword: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: "Passwords don't match.",
		path: ["confirmPassword"],
	});

type ChangePasswordFormProps = React.ComponentProps<typeof Card>;

const ChangePasswordForm = ({
	className,
	...props
}: ChangePasswordFormProps) => {
	const router = useRouter();

	const form = useAuthForm({
		schema: changePasswordSchema,
		onSubmit: async ({ currentPassword, newPassword }, formElement) => {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});

			if (error?.code === "INVALID_PASSWORD") {
				form.setFieldError(
					"currentPassword",
					getAuthErrorMessage(error),
					formElement,
				);
				return;
			}
			if (error) {
				form.setAuthError(error);
				return;
			}

			toast.success("Password changed. Other sessions were signed out.");
			formElement.reset();
			router.refresh();
		},
	});

	const formId = form.fieldId("form");

	return (
		<Card data-slot="change-password-form" className={cn(className)} {...props}>
			<CardHeader>
				<CardTitle>Password</CardTitle>
				<CardDescription>
					Changing your password signs you out of other devices.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					id={formId}
					noValidate
					aria-busy={form.isPending || undefined}
					className="flex flex-col gap-4"
					onSubmit={form.handleSubmit}
				>
					<FieldGroup className="gap-4">
						<Field
							data-invalid={
								Boolean(form.fieldErrors.currentPassword) || undefined
							}
						>
							<FieldLabel htmlFor={form.fieldId("currentPassword")}>
								Current password
							</FieldLabel>
							<PasswordInput
								autoComplete="current-password"
								disabled={form.isPending}
								{...form.getFieldProps("currentPassword")}
							/>
							<FieldError {...form.getErrorProps("currentPassword")} />
						</Field>
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
							{form.fieldErrors.newPassword ? (
								<FieldError {...form.getErrorProps("newPassword")} />
							) : (
								<FieldDescription>
									At least {PASSWORD_MIN_LENGTH} characters.
								</FieldDescription>
							)}
						</Field>
						<Field
							data-invalid={
								Boolean(form.fieldErrors.confirmPassword) || undefined
							}
						>
							<FieldLabel htmlFor={form.fieldId("confirmPassword")}>
								Confirm new password
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
				</form>
			</CardContent>
			<CardFooter className="justify-end">
				<Button type="submit" form={formId} disabled={form.isPending}>
					{form.isPending && <Spinner />}
					Change password
				</Button>
			</CardFooter>
		</Card>
	);
};

type PasswordNotSetNoticeProps = React.ComponentProps<typeof Card> & {
	// false when password reset is off (production without a mailer)
	canResetPassword?: boolean;
};

const PasswordNotSetNotice = ({
	canResetPassword = true,
	className,
	...props
}: PasswordNotSetNoticeProps) => (
	<Card
		data-slot="password-not-set-notice"
		size="sm"
		className={cn(className)}
		{...props}
	>
		<CardHeader>
			<CardTitle>Password</CardTitle>
			<CardDescription>
				You sign in with a provider or an email link, so there&apos;s no
				password to change.
				{canResetPassword && (
					<>
						{" "}
						To set one, use{" "}
						<Link
							href={FORGOT_PASSWORD_PATH}
							className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							Forgot password?
						</Link>
					</>
				)}
			</CardDescription>
		</CardHeader>
	</Card>
);

export { ChangePasswordForm, PasswordNotSetNotice };
