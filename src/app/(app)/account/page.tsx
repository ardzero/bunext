import type { Metadata } from "next";
import { headers } from "next/headers";
import { ActiveSessions } from "@/components/auth/active-sessions";
import {
	ChangePasswordForm,
	PasswordNotSetNotice,
} from "@/components/auth/change-password-form";
import { ConnectedAccounts } from "@/components/auth/connected-accounts";
import { ProfileForm } from "@/components/auth/profile-form";
import { auth } from "@/lib/auth/auth";
import { enabledProviders } from "@/lib/auth/providers";
import { getParam, type SearchParams } from "@/lib/auth/search-params";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Account" };

// the account id Better Auth uses for email + password sign-in
const CREDENTIAL_PROVIDER_ID = "credential";

const AccountPage = async ({
	searchParams,
}: {
	searchParams: SearchParams;
}) => {
	const { user, session } = await requireSession();
	const requestHeaders = await headers();
	const [accounts, sessions, params] = await Promise.all([
		auth.api.listUserAccounts({ headers: requestHeaders }),
		auth.api.listSessions({ headers: requestHeaders }),
		searchParams,
	]);
	const hasPassword = accounts.some(
		(account) => account.providerId === CREDENTIAL_PROVIDER_ID,
	);

	return (
		<>
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Account</h1>
				<p className="text-sm text-muted-foreground">
					Manage your profile, sign-in methods and sessions.
				</p>
			</div>
			<div className="flex w-full max-w-2xl flex-col gap-6">
				<ProfileForm user={user} />
				{hasPassword ? <ChangePasswordForm /> : <PasswordNotSetNotice />}
				<ConnectedAccounts
					providers={enabledProviders}
					accounts={accounts}
					error={getParam(params, "error")}
				/>
				<ActiveSessions sessions={sessions} currentSessionId={session.id} />
			</div>
		</>
	);
};

export default AccountPage;
