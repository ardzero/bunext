// Validate env at startup (exit on a missing BETTER_AUTH_SECRET in production)
// and log the mailer warning once, instead of failing on the first request.
try {
	await import("@/lib/auth/mailer");
} catch (error) {
	console.error(`\n${(error as Error).message}\n`);
	process.exit(1);
}

export {};
