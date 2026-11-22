import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { signInHref } from "@/components/auth/auth-paths";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { passwordResetEnabled } from "@/lib/auth/auth";
import { DEFAULT_REDIRECT } from "@/lib/auth/safe-redirect";
import { redirectIfSignedIn } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Forgot password" };

const ForgotPasswordPage = async () => {
	// production without a mailer: no reset emails can be sent
	if (!passwordResetEnabled) notFound();
	await redirectIfSignedIn(DEFAULT_REDIRECT);

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle className="text-lg">Forgot your password?</CardTitle>
				<CardDescription>
					Enter your email and we&apos;ll send you a link to reset it.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ForgotPasswordForm />
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

export default ForgotPasswordPage;
