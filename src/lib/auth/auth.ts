import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, userAc } from "better-auth/plugins/admin/access";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { baseURL, env, isBuildPhase, trustedOrigins } from "@/lib/env";
import { requireDeletionPassword } from "./delete-account";
import {
	consumeEmailRateLimit,
	emailRateLimitKey,
	MAIL_SENDING_PATHS,
} from "./email-rate-limit";
import {
	captureMissingProviderAvatarAfterUpdate,
	captureProviderAvatarAfterLink,
	forgetProviderAvatarAfterUnlink,
} from "./link-hooks";
import {
	canSendMail,
	hasRealMailer,
	renderActionEmail,
	sendMail,
} from "./mailer";
import { enabledProviderConfigs } from "./providers";
import { ADMIN_ROLES, DEFAULT_ROLE, type Role } from "./roles";

// Admin plugin permissions per role. Adding a role to ROLES in roles.ts makes
// this a type error until it gets permissions here (setRole rejects unknown roles).
const accessControl = createAccessControl(defaultStatements);
// Admins can view users, ban or unban them and revoke their sessions. Not
// granted: impersonation, changing roles (use `bun run seed:admin`), deleting
// users and setting their password, email or phone.
const adminAc = accessControl.newRole({
	user: ["list", "get", "ban"],
	session: ["list", "revoke"],
});
const rolePermissions = {
	user: userAc,
	admin: adminAc,
} satisfies Record<Role, unknown>;

// Magic links and password reset need a mailer that reaches the user. In
// development the console mailer prints the link; production needs a real one.
export const magicLinkEnabled = canSendMail;
export const passwordResetEnabled = canSendMail;

// Better Auth's rate limiting is on in production only; follow it
const emailRateLimitEnabled = env.NODE_ENV === "production";

// Better Auth only checks `sendResetPassword` when a reset is requested; the
// endpoints that consume a token would still accept one issued earlier.
const RESET_PASSWORD_PATHS = ["/reset-password", "/reset-password/:token"];

const assertPasswordResetEnabled = (path: string) => {
	if (passwordResetEnabled || !RESET_PASSWORD_PATHS.includes(path)) return;
	throw new APIError("BAD_REQUEST", {
		message: "Password reset is disabled.",
		code: "RESET_PASSWORD_DISABLED",
	});
};

// caps mail per address across the mail-sending endpoints (see email-rate-limit.ts)
const limitMailPerAddress = async (path: string, email: unknown) => {
	if (!emailRateLimitEnabled || !MAIL_SENDING_PATHS.includes(path)) return;
	if (typeof email !== "string" || !email) return;

	if (await consumeEmailRateLimit(emailRateLimitKey(email))) return;
	throw new APIError("TOO_MANY_REQUESTS", {
		message:
			"Too many emails were requested for this address. Try again later.",
	});
};

const beforeAuthRequest = createAuthMiddleware(async (ctx) => {
	await requireDeletionPassword(ctx);
	assertPasswordResetEnabled(ctx.path);
	await limitMailPerAddress(ctx.path, ctx.body?.email);
});

const socialProviders = Object.fromEntries(
	enabledProviderConfigs.map(({ id, clientId, clientSecret }) => [
		id,
		{ clientId, clientSecret },
	]),
);

const magicLinkPlugins = magicLinkEnabled
	? [
			magicLink({
				expiresIn: 60 * 10,
				// a leaked verification table can't be used to sign in
				storeToken: "hashed",
				sendMagicLink: async ({ email, url }) => {
					await sendMail({
						to: email,
						subject: "Your sign-in link",
						html: renderActionEmail({
							heading: "Sign in",
							body: "Use the button below to sign in. The link expires in 10 minutes and works once.",
							actionLabel: "Sign in",
							actionUrl: url,
						}),
					});
				},
			}),
		]
	: [];

type AuthEmail = { user: { email: string }; url: string };

const sendResetPassword = async ({ user, url }: AuthEmail) => {
	await sendMail({
		to: user.email,
		subject: "Reset your password",
		html: renderActionEmail({
			heading: "Reset your password",
			body: "Use the button below to choose a new password. The link expires in 1 hour.",
			actionLabel: "Reset password",
			actionUrl: url,
		}),
	});
};

const sendVerificationEmail = async ({ user, url }: AuthEmail) => {
	await sendMail({
		to: user.email,
		subject: "Verify your email",
		html: renderActionEmail({
			heading: "Verify your email",
			body: "Confirm your email address to finish setting up your account.",
			actionLabel: "Verify email",
			actionUrl: url,
		}),
	});
};

export const auth = betterAuth({
	baseURL,
	// `next build` evaluates this module without runtime secrets; env.ts
	// enforces a real secret everywhere else
	secret:
		env.BETTER_AUTH_SECRET ??
		(isBuildPhase
			? "build-phase-placeholder-secret-not-used-at-runtime"
			: undefined),
	trustedOrigins,
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: hasRealMailer,
		revokeSessionsOnPasswordReset: true,
		// without it Better Auth refuses reset requests
		sendResetPassword: passwordResetEnabled ? sendResetPassword : undefined,
	},
	emailVerification: {
		sendOnSignUp: hasRealMailer,
		sendOnSignIn: hasRealMailer,
		autoSignInAfterVerification: true,
		sendVerificationEmail: canSendMail ? sendVerificationEmail : undefined,
	},
	user: {
		deleteUser: { enabled: true },
	},
	socialProviders,
	account: {
		accountLinking: {
			enabled: true,
			// Implicit linking needs a verified provider email AND a verified local
			// email (Better Auth's requireLocalEmailVerified default). Linking onto
			// an unverified local account would let whoever registered the address
			// first share the account; those users get `account_not_linked`.
			trustedProviders: [],
			// a signed-in user may link a provider account that uses another email
			allowDifferentEmails: true,
		},
	},
	databaseHooks: {
		account: {
			create: {
				after: captureProviderAvatarAfterLink,
			},
			update: { after: captureMissingProviderAvatarAfterUpdate },
			delete: { after: forgetProviderAvatarAfterUnlink },
		},
	},
	hooks: { before: beforeAuthRequest },
	rateLimit: {
		storage: "database",
		customRules: {
			"/sign-in/magic-link": { window: 60, max: 3 },
			"/request-password-reset": { window: 60, max: 3 },
		},
	},
	plugins: [
		admin({
			ac: accessControl,
			roles: rolePermissions,
			defaultRole: DEFAULT_ROLE,
			adminRoles: ADMIN_ROLES,
		}),
		...magicLinkPlugins,
		// must stay last: lets server actions set auth cookies
		nextCookies(),
	],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
