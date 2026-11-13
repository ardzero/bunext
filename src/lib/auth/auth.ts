import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	userAc,
} from "better-auth/plugins/admin/access";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { baseURL, env, isBuildPhase } from "@/lib/env";
import {
	captureMissingProviderAvatarAfterUpdate,
	captureProviderAvatarAfterLink,
	stripUnprovenAccessBeforeLink,
} from "./link-hooks";
import { hasRealMailer, renderActionEmail, sendMail } from "./mailer";
import { enabledProviderConfigs } from "./providers";
import { ADMIN_ROLES, DEFAULT_ROLE, type Role } from "./roles";

// Admin plugin permissions per role. Adding a role to ROLES in roles.ts makes
// this a type error until it gets permissions here (setRole rejects unknown roles).
const accessControl = createAccessControl(defaultStatements);
const rolePermissions = {
	user: userAc,
	admin: adminAc,
} satisfies Record<Role, unknown>;

// Magic links need a mailer that reaches the user. In development the console
// mailer prints the link; in production a real mailer is required.
export const magicLinkEnabled = hasRealMailer || env.NODE_ENV !== "production";

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

export const auth = betterAuth({
	baseURL,
	// `next build` evaluates this module without runtime secrets; env.ts
	// enforces a real secret everywhere else
	secret:
		env.BETTER_AUTH_SECRET ??
		(isBuildPhase
			? "build-phase-placeholder-secret-not-used-at-runtime"
			: undefined),
	trustedOrigins: baseURL ? [baseURL] : undefined,
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: hasRealMailer,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
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
		},
	},
	emailVerification: {
		sendOnSignUp: hasRealMailer,
		sendOnSignIn: hasRealMailer,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
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
		},
	},
	socialProviders,
	account: {
		accountLinking: {
			enabled: true,
			// No trusted providers: any provider links implicitly, but only when it
			// reports a verified email (that is the proof of ownership).
			trustedProviders: [],
			// The local account may be unverified (no mailer, or verification still
			// pending); the provider's verified email replaces that proof. The
			// databaseHooks strip whatever an unproven account accrued first.
			requireLocalEmailVerified: false,
			// a signed-in user may link a provider account that uses another email
			allowDifferentEmails: true,
		},
	},
	databaseHooks: {
		account: {
			create: {
				before: stripUnprovenAccessBeforeLink,
				after: captureProviderAvatarAfterLink,
			},
			update: { after: captureMissingProviderAvatarAfterUpdate },
		},
	},
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
