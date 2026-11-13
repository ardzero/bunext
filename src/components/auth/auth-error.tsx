import { CircleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Better Auth error codes and OAuth callback `?error=` values, in plain words.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
	// credentials
	INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
	INVALID_PASSWORD: "Incorrect password.",
	USER_ALREADY_EXISTS: "An account with this email already exists.",
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
		"An account with this email already exists.",
	EMAIL_NOT_VERIFIED: "Verify your email address before signing in.",
	PASSWORD_TOO_SHORT: "Password is too short.",
	PASSWORD_TOO_LONG: "Password is too long.",
	CREDENTIAL_ACCOUNT_NOT_FOUND: "This account has no password set.",
	// tokens and links
	INVALID_TOKEN: "This link is invalid, expired or has already been used.",
	TOKEN_EXPIRED: "This link has expired.",
	// accounts and sessions
	FAILED_TO_UNLINK_LAST_ACCOUNT:
		"You can't remove your only sign-in method. Add another one first.",
	ACCOUNT_NOT_FOUND: "This account is no longer connected.",
	SESSION_EXPIRED: "For your security, sign in again to make this change.",
	FIELD_NOT_ALLOWED: "That change isn't allowed.",
	// rate limiting
	TOO_MANY_REQUESTS: "Too many attempts. Wait a moment and try again.",
	// OAuth callback errors
	account_not_linked:
		"This provider hasn't verified your email address, so we couldn't connect it to your existing account. Sign in another way instead.",
	account_already_linked_to_different_user:
		"This provider account is already connected to a different user.",
	email_does_not_match: "The provider account uses a different email address.",
	unable_to_link_account: "We couldn't connect this account. Try again.",
	access_denied: "Sign-in was cancelled.",
	email_not_found: "The provider didn't share an email address.",
	email_not_verified: "The provider hasn't verified your email address.",
	unable_to_get_user_info: "We couldn't read your profile from the provider.",
	invalid_code: "Sign-in expired. Try again.",
	no_code: "Sign-in expired. Try again.",
	state_mismatch: "Sign-in expired. Try again.",
	please_restart_the_process: "Sign-in expired. Try again.",
	oauth_provider_not_found: "This sign-in provider isn't available.",
	new_user_signup_disabled: "Sign-up is currently disabled.",
	failed_to_create_user: "We couldn't create your account. Try again.",
	failed_to_create_session: "We couldn't sign you in. Try again.",
	user_not_found: "We couldn't find your account.",
};

const FALLBACK_MESSAGE = "Something went wrong. Try again.";

type AuthErrorLike = {
	code?: string | null;
	message?: string | null;
	status?: number;
};

// Maps an error code (or a Better Auth client error) to a readable message.
const getAuthErrorMessage = (
	error: string | AuthErrorLike | null | undefined,
) => {
	if (!error) return FALLBACK_MESSAGE;
	if (typeof error === "string")
		return AUTH_ERROR_MESSAGES[error] ?? FALLBACK_MESSAGE;
	if (error.status === 429) return AUTH_ERROR_MESSAGES.TOO_MANY_REQUESTS;
	if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
		return AUTH_ERROR_MESSAGES[error.code];
	}
	return error.message || FALLBACK_MESSAGE;
};

type AuthErrorProps = React.ComponentProps<"div"> & {
	// an error code, e.g. from the `?error=` query param; children override the message
	code?: string | null;
};

const AuthError = ({ code, className, children, ...props }: AuthErrorProps) => {
	if (!code && !children) return null;

	return (
		<div
			role="alert"
			data-slot="auth-error"
			className={cn(
				"flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive",
				className,
			)}
			{...props}
		>
			<CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
			<div className="min-w-0 flex-1">
				{children ?? getAuthErrorMessage(code)}
			</div>
		</div>
	);
};

export { AuthError, getAuthErrorMessage, type AuthErrorLike };
