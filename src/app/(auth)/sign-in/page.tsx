import type { Metadata } from "next";
import Link from "next/link";
import { AuthError } from "@/components/auth/auth-error";
import { signInHref, signUpHref } from "@/components/auth/auth-paths";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { SignInForm } from "@/components/auth/sign-in-form";
import {
	SignInMethodPanel,
	SignInMethodToggle,
} from "@/components/auth/sign-in-method";
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
import { magicLinkEnabled, passwordResetEnabled } from "@/lib/auth/auth";
import { enabledProviders } from "@/lib/auth/providers";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { getParam, type SearchParams } from "@/lib/auth/search-params";
import { redirectIfSignedIn } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

const SignInPage = async ({ searchParams }: { searchParams: SearchParams }) => {
	const params = await searchParams;
	const redirectTo = safeRedirect(getParam(params, "returnTo"));
	await redirectIfSignedIn(redirectTo);

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle className="text-lg">Sign in</CardTitle>
				<CardDescription>Welcome back. Sign in to continue.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<AuthError code={getParam(params, "error")} />
				<SocialButtons
					providers={enabledProviders}
					redirectTo={redirectTo}
					errorRedirectTo={signInHref(redirectTo)}
				>
					<FieldSeparator className="my-0 *:data-[slot=field-separator-content]:bg-card">
						or
					</FieldSeparator>
				</SocialButtons>
				{magicLinkEnabled ? (
					<>
						<SignInMethodPanel method="password">
							<SignInForm
								redirectTo={redirectTo}
								canResetPassword={passwordResetEnabled}
							/>
						</SignInMethodPanel>
						<SignInMethodPanel method="magic-link">
							<MagicLinkForm redirectTo={redirectTo} />
						</SignInMethodPanel>
						<SignInMethodToggle />
					</>
				) : (
					<SignInForm
						redirectTo={redirectTo}
						canResetPassword={passwordResetEnabled}
					/>
				)}
			</CardContent>
			<CardFooter className="justify-center gap-1 text-muted-foreground">
				Don&apos;t have an account?
				<Link
					href={signUpHref(redirectTo)}
					className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					Sign up
				</Link>
			</CardFooter>
		</Card>
	);
};

export default SignInPage;
