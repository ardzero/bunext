import type { Metadata } from "next";
import {
	VerifyEmailStatus,
	type VerifyEmailState,
} from "@/components/auth/verify-email-status";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { getParam, type SearchParams } from "@/lib/auth/search-params";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Verify email" };

// The verification link signs the user in and lands here; errors arrive as `?error=`.
const VerifyEmailPage = async ({
	searchParams,
}: {
	searchParams: SearchParams;
}) => {
	const params = await searchParams;
	const redirectTo = safeRedirect(getParam(params, "returnTo"));
	const error = getParam(params, "error");
	const session = await getSession();

	const getStatus = (): VerifyEmailState => {
		if (error) return "error";
		if (session?.user.emailVerified) return "verified";
		return "unverified";
	};

	return (
		<Card>
			<CardHeader className="text-center">
				<CardTitle className="text-lg">Email verification</CardTitle>
				<CardDescription>Confirm the address on your account.</CardDescription>
			</CardHeader>
			<CardContent>
				<VerifyEmailStatus
					status={getStatus()}
					error={error}
					email={session?.user.email}
					redirectTo={redirectTo}
				/>
			</CardContent>
		</Card>
	);
};

export default VerifyEmailPage;
