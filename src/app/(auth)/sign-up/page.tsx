import type { Metadata } from "next";
import Link from "next/link";
import { AuthError } from "@/components/auth/auth-error";
import { signInHref, signUpHref } from "@/components/auth/auth-paths";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SocialButtons } from "@/components/auth/social-buttons";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FieldSeparator } from "@/components/ui/field";
import { enabledProviders } from "@/lib/auth/providers";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { getParam, type SearchParams } from "@/lib/auth/search-params";
import { redirectIfSignedIn } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account" };

const SignUpPage = async ({ searchParams }: { searchParams: SearchParams }) => {
	const params = await searchParams;
	const redirectTo = safeRedirect(getParam(params, "returnTo"));
	await redirectIfSignedIn(redirectTo);

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle className="text-lg">Create your account</CardTitle>
				<CardDescription>Get started in a few seconds.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<AuthError code={getParam(params, "error")} />
				<SocialButtons
					providers={enabledProviders}
					redirectTo={redirectTo}
					errorRedirectTo={signUpHref(redirectTo)}
				>
					<FieldSeparator className="my-0 *:data-[slot=field-separator-content]:bg-card">
						or
					</FieldSeparator>
				</SocialButtons>
				<SignUpForm redirectTo={redirectTo} />
			</CardContent>
			<CardFooter className="justify-center gap-1 text-muted-foreground">
				Already have an account?
				<Link
					href={signInHref(redirectTo)}
					className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					Sign in
				</Link>
			</CardFooter>
		</Card>
	);
};

export default SignUpPage;
