// Promotes the existing user whose email equals ADMIN_EMAIL to admin.
// Usage: bun run seed:admin
import { db } from "@/lib/db";
import { hasMailerConfig, promoteAdmin } from "./lib/promote-admin";

const seedAdmin = async () => {
	const adminEmail = process.env.ADMIN_EMAIL?.trim();
	if (!adminEmail) {
		console.error("ADMIN_EMAIL is not set in .env.local.");
		process.exit(1);
	}

	const { promoted, message } = await promoteAdmin(db, {
		email: adminEmail,
		requireVerified: hasMailerConfig(process.env),
	});

	if (promoted) console.info(message);
	else console.error(message);
	process.exit(promoted ? 0 : 1);
};

await seedAdmin();
