import type { Metadata } from "next";
import { headers } from "next/headers";
import { ActiveSessions } from "@/components/auth/active-sessions";
import {
	ChangePasswordForm,
	SetPasswordForm,
} from "@/components/auth/change-password-form";
import { ConnectedAccounts } from "@/components/auth/connected-accounts";
import { DeleteAccount } from "@/components/auth/delete-account";
import { ProfileForm } from "@/components/auth/profile-form";
import { ProfilePicture } from "@/components/auth/profile-picture";
import { auth } from "@/lib/auth/auth";
import { listProviderAvatars } from "@/lib/auth/provider-avatars";
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
	const [accounts, sessions, avatars, params] = await Promise.all([
		auth.api.listUserAccounts({ headers: requestHeaders }),
		auth.api.listSessions({ headers: requestHeaders }),
		listProviderAvatars(user.id),
		searchParams,
	]);
	const hasPassword = accounts.some(
		(account) => account.providerId === CREDENTIAL_PROVIDER_ID,
	);

	const connectedProviders = enabledProviders.filter((provider) =>
		accounts.some((account) => account.providerId === provider.id),
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
				<ProfilePicture
					user={user}
					providers={connectedProviders}
					avatars={avatars}
				/>
				{hasPassword ? <ChangePasswordForm /> : <SetPasswordForm />}
				<ConnectedAccounts
					providers={enabledProviders}
					accounts={accounts}
					error={getParam(params, "error")}
				/>
				<ActiveSessions sessions={sessions} currentSessionId={session.id} />
				<DeleteAccount hasPassword={hasPassword} />
			</div>
		</>
	);
};

export default AccountPage;
