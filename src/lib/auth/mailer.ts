import "server-only";
import { Resend } from "resend";
import { env, isBuildPhase } from "@/lib/env";

export type MailMessage = {
	to: string;
	subject: string;
	html: string;
};

export type Mailer = {
	sendMail: (message: MailMessage) => Promise<void>;
};

// A real mailer turns on required email verification and production magic links.
// Tests always use the console mailer so they never send real email.
export const hasRealMailer =
	Boolean(env.RESEND_API_KEY && env.MAIL_FROM) && env.NODE_ENV !== "test";

const createResendMailer = (apiKey: string, from: string): Mailer => {
	const resend = new Resend(apiKey);

	return {
		sendMail: async ({ to, subject, html }) => {
			const { error } = await resend.emails.send({ from, to, subject, html });
			if (error)
				throw new Error(`Resend failed to send mail: ${error.message}`);
		},
	};
};

// development mailer: prints the message (and its links) to the server console
const consoleMailer: Mailer = {
	sendMail: async ({ to, subject, html }) => {
		const links = [...html.matchAll(/href="([^"]+)"/g)].map(([, href]) => href);
		console.info(
			[
				"",
				"── mail (console mailer) ─────────────────────",
				`to:      ${to}`,
				`subject: ${subject}`,
				...links.map((link) => `link:    ${link}`),
				"──────────────────────────────────────────────",
				"",
			].join("\n"),
		);
	},
};

// instrumentation and route bundles each evaluate this module; warn only once
const globalForMailer = globalThis as unknown as { warnedNoMailer?: boolean };

const warnNoMailerOnce = () => {
	if (globalForMailer.warnedNoMailer) return;
	globalForMailer.warnedNoMailer = true;
	console.warn(
		"[auth] No mailer configured (RESEND_API_KEY and MAIL_FROM). Emails are printed to the console, email verification is not required and magic links are disabled.",
	);
};

const createMailer = (): Mailer => {
	if (hasRealMailer && env.RESEND_API_KEY && env.MAIL_FROM) {
		return createResendMailer(env.RESEND_API_KEY, env.MAIL_FROM);
	}

	if (env.NODE_ENV === "production" && !isBuildPhase) warnNoMailerOnce();
	return consoleMailer;
};

export const { sendMail } = createMailer();

// minimal HTML shared by every auth email
export const renderActionEmail = ({
	heading,
	body,
	actionLabel,
	actionUrl,
}: {
	heading: string;
	body: string;
	actionLabel: string;
	actionUrl: string;
}) => `<!doctype html>
<html>
	<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
		<h1 style="font-size: 20px;">${heading}</h1>
		<p>${body}</p>
		<p><a href="${actionUrl}" style="display: inline-block; padding: 10px 16px; background: #111; color: #fff; border-radius: 6px; text-decoration: none;">${actionLabel}</a></p>
		<p style="font-size: 12px; color: #666;">If you did not request this, you can ignore this email.</p>
	</body>
</html>`;
