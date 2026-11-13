// Validate env at startup (in production: exit on a missing BETTER_AUTH_SECRET,
// base URL or mailer) and log the no-mailer warning once, instead of failing
// on the first request.
try {
	await import("@/lib/auth/mailer");
} catch (error) {
	console.error(`\n${(error as Error).message}\n`);
	process.exit(1);
}

export {};
