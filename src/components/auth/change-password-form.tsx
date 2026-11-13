"use client";

import { useState } from "react";
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
import { setPassword } from "@/actions/password";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { AuthError, getAuthErrorMessage } from "./auth-error";
import { signInHref } from "./auth-paths";
import { PasswordInput } from "./password-input";
import { PASSWORD_MIN_LENGTH, passwordSchema } from "./schemas";
import { SignOutButton } from "./sign-out-button";
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

const setPasswordSchema = z
	.object({
		newPassword: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: "Passwords don't match.",
		path: ["confirmPassword"],
	});

// where the user comes back to after signing in again
const ACCOUNT_PATH = "/account";

type SetPasswordFormProps = React.ComponentProps<typeof Card>;

// For accounts that sign in with a provider or an email link only.
const SetPasswordForm = ({ className, ...props }: SetPasswordFormProps) => {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	// the session is too old to add a password; signing in again makes a fresh one
	const [needsSignIn, setNeedsSignIn] = useState(false);

	const form = useAuthForm({
		schema: setPasswordSchema,
		onSubmit: async ({ newPassword }, formElement) => {
			const { error } = await setPassword(newPassword);
			setNeedsSignIn(error === "SESSION_NOT_FRESH");
			if (error) {
				form.setAuthError(error);
				return;
			}

			toast.success("Password set. You can now sign in with it.");
			formElement.reset();
			router.refresh();
		},
	});

	const formId = form.fieldId("form");

	const handleOpen = () => setIsOpen(true);
	const handleCancel = () => {
		setIsOpen(false);
		setNeedsSignIn(false);
		form.clearErrors();
	};

	return (
		<Card data-slot="set-password-form" className={cn(className)} {...props}>
			<CardHeader>
				<CardTitle>Password</CardTitle>
				<CardDescription>
					You sign in with a provider or an email link. Set a password to sign
					in with your email and password too.
				</CardDescription>
			</CardHeader>
			{isOpen ? (
				<>
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
										Boolean(form.fieldErrors.newPassword) || undefined
									}
								>
									<FieldLabel htmlFor={form.fieldId("newPassword")}>
										New password
									</FieldLabel>
									<PasswordInput
										autoComplete="new-password"
										autoFocus
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
							{form.formError && (
								<AuthError>
									{form.formError}
									{needsSignIn && (
										<>
											{" "}
											<SignOutButton
												variant="link"
												redirectTo={signInHref(ACCOUNT_PATH)}
												className="h-auto p-0 text-sm text-destructive underline"
											>
												Sign in again
											</SignOutButton>
										</>
									)}
								</AuthError>
							)}
						</form>
					</CardContent>
					<CardFooter className="justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							disabled={form.isPending}
							onClick={handleCancel}
						>
							Cancel
						</Button>
						<Button type="submit" form={formId} disabled={form.isPending}>
							{form.isPending && <Spinner />}
							Set password
						</Button>
					</CardFooter>
				</>
			) : (
				<CardFooter className="justify-end">
					<Button
						type="button"
						aria-expanded={false}
						aria-controls={formId}
						onClick={handleOpen}
					>
						Set password
					</Button>
				</CardFooter>
			)}
		</Card>
	);
};

export { ChangePasswordForm, SetPasswordForm };
