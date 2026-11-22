"use client";

import { useState } from "react";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/utils/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { AuthError } from "./auth-error";
import { signInHref } from "./auth-paths";
import { PasswordInput } from "./password-input";
import { SignOutButton } from "./sign-out-button";
import { useAuthForm } from "./use-auth-form";

type DeleteAccountProps = React.ComponentProps<typeof Card> & {
	hasPassword: boolean;
};

const DeleteAccount = ({
	hasPassword,
	className,
	...props
}: DeleteAccountProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [needsSignIn, setNeedsSignIn] = useState(false);
	const form = useAuthForm({
		schema: z.object({
			confirmation: z.literal("DELETE", { error: "Type DELETE to confirm." }),
			password: hasPassword
				? z.string().min(1, "Enter your current password.")
				: z.string().optional(),
		}),
		onSubmit: async ({ password }, formElement) => {
			setNeedsSignIn(false);
			try {
				const { error } = await authClient.deleteUser({
					password: hasPassword ? password : undefined,
				});
				if (error?.code === "INVALID_PASSWORD") {
					form.setFieldError("password", "Incorrect password.", formElement);
					return;
				}
				if (error) {
					setNeedsSignIn(
						error.code === "SESSION_EXPIRED" ||
							error.code === "SESSION_NOT_FRESH",
					);
					form.setAuthError(error);
					return;
				}
				// A full navigation clears private client state after account deletion.
				// eslint-disable-next-line @next/next/no-location-assign-relative-destination
				window.location.assign("/");
			} catch {
				form.setFormError("Couldn't delete your account. Try again.");
			}
		},
	});

	const handleOpenChange = (open: boolean) => {
		if (form.isPending) return;
		setIsOpen(open);
		setNeedsSignIn(false);
		form.clearErrors();
	};

	return (
		<Card
			data-slot="delete-account"
			className={cn("border-destructive/30", className)}
			{...props}
		>
			<CardHeader>
				<CardTitle>Delete account</CardTitle>
				<CardDescription>
					Permanently delete your account and associated data. This cannot be
					undone.
				</CardDescription>
			</CardHeader>
			<CardFooter className="justify-end">
				<AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
					<AlertDialogTrigger asChild>
						<Button variant="destructive">Delete account</Button>
					</AlertDialogTrigger>
					<AlertDialogContent
						onEscapeKeyDown={(event) => {
							if (form.isPending) event.preventDefault();
						}}
					>
						<AlertDialogHeader>
							<AlertDialogTitle>
								Delete your account permanently?
							</AlertDialogTitle>
							<AlertDialogDescription>
								Your profile, connected accounts and sessions will be deleted.
								You will be signed out on all devices. This cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<form
							id={form.fieldId("form")}
							noValidate
							aria-busy={form.isPending || undefined}
							className="flex flex-col gap-4"
							onSubmit={form.handleSubmit}
						>
							{hasPassword && (
								<Field
									data-invalid={Boolean(form.fieldErrors.password) || undefined}
								>
									<FieldLabel htmlFor={form.fieldId("password")}>
										Current password
									</FieldLabel>
									<PasswordInput
										autoComplete="current-password"
										disabled={form.isPending}
										{...form.getFieldProps("password")}
									/>
									<FieldError {...form.getErrorProps("password")} />
								</Field>
							)}
							<Field
								data-invalid={
									Boolean(form.fieldErrors.confirmation) || undefined
								}
							>
								<FieldLabel htmlFor={form.fieldId("confirmation")}>
									Type DELETE to confirm
								</FieldLabel>
								<Input
									autoComplete="off"
									spellCheck={false}
									disabled={form.isPending}
									{...form.getFieldProps("confirmation")}
								/>
								<FieldError {...form.getErrorProps("confirmation")} />
							</Field>
							{form.formError && (
								<AuthError>
									{form.formError}
									{needsSignIn && (
										<SignOutButton
											type="button"
											variant="link"
											redirectTo={signInHref("/account")}
											className="h-auto p-0 text-destructive underline"
										>
											Sign in again
										</SignOutButton>
									)}
								</AuthError>
							)}
						</form>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={form.isPending}>
								Cancel
							</AlertDialogCancel>
							<Button
								variant="destructive"
								type="submit"
								form={form.fieldId("form")}
								disabled={form.isPending}
							>
								{form.isPending && <Spinner />}
								Delete permanently
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardFooter>
		</Card>
	);
};

export { DeleteAccount };
