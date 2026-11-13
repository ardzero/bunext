import type { Metadata } from "next";
import Link from "next/link";
import { signInHref } from "@/components/auth/auth-paths";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getParam, type SearchParams } from "@/lib/auth/search-params";

export const metadata: Metadata = { title: "Reset password" };

const ResetPasswordPage = async ({
	searchParams,
}: {
	searchParams: SearchParams;
}) => {
	const params = await searchParams;

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle className="text-lg">Choose a new password</CardTitle>
				<CardDescription>
					You&apos;ll be signed out on your other devices.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ResetPasswordForm
					token={getParam(params, "token")}
					error={getParam(params, "error")}
				/>
			</CardContent>
			<CardFooter className="justify-center">
				<Link
					href={signInHref()}
					className="rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					Back to sign in
				</Link>
			</CardFooter>
		</Card>
	);
};

export default ResetPasswordPage;
