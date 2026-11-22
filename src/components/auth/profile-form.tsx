"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
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
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/utils/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { AuthError } from "./auth-error";
import { nameSchema } from "./schemas";
import { useAuthForm } from "./use-auth-form";

const profileSchema = z.object({
	name: nameSchema,
});

type ProfileFormProps = React.ComponentProps<typeof Card> & {
	user: { name: string; email: string; emailVerified: boolean };
};

const ProfileForm = ({ user, className, ...props }: ProfileFormProps) => {
	const router = useRouter();

	const form = useAuthForm({
		schema: profileSchema,
		onSubmit: async ({ name }) => {
			const { error } = await authClient.updateUser({ name });
			if (error) {
				form.setAuthError(error);
				return;
			}
			toast.success("Profile updated");
			router.refresh();
		},
	});

	const formId = form.fieldId("form");

	return (
		<Card data-slot="profile-form" className={cn(className)} {...props}>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
				<CardDescription>Your name and email address.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<form
					id={formId}
					noValidate
					aria-busy={form.isPending || undefined}
					className="flex flex-col gap-4"
					onSubmit={form.handleSubmit}
				>
					<FieldGroup className="gap-4">
						<Field data-invalid={Boolean(form.fieldErrors.name) || undefined}>
							<FieldLabel htmlFor={form.fieldId("name")}>Name</FieldLabel>
							<Input
								autoComplete="name"
								defaultValue={user.name}
								disabled={form.isPending}
								{...form.getFieldProps("name")}
							/>
							<FieldError {...form.getErrorProps("name")} />
						</Field>
					</FieldGroup>
					<AuthError>{form.formError}</AuthError>
				</form>
				<div className="flex min-w-0 flex-col gap-1.5">
					<span className="text-sm font-medium">Email</span>
					<div className="flex min-w-0 flex-wrap items-center gap-2">
						<span className="min-w-0 truncate text-sm text-muted-foreground">
							{user.email}
						</span>
						{user.emailVerified ? (
							<Badge variant="secondary">Verified</Badge>
						) : (
							<Badge variant="outline">Unverified</Badge>
						)}
					</div>
				</div>
			</CardContent>
			<CardFooter className="justify-end">
				<Button type="submit" form={formId} disabled={form.isPending}>
					{form.isPending && <Spinner />}
					Save
				</Button>
			</CardFooter>
		</Card>
	);
};

export { ProfileForm };
