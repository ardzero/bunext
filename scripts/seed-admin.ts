// Promotes the existing user whose email equals ADMIN_EMAIL to admin.
// Usage: bun run seed:admin
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

const exitWith = (message: string, code: number): never => {
	if (code === 0) console.info(message);
	else console.error(message);
	process.exit(code);
};

const seedAdmin = async () => {
	if (!adminEmail) exitWith("ADMIN_EMAIL is not set in .env.local.", 1);

	const [existingUser] = await db
		.select({ id: user.id, role: user.role })
		.from(user)
		.where(eq(user.email, adminEmail!))
		.limit(1);

	if (!existingUser) {
		exitWith(
			`No user with email ${adminEmail}. Sign up first, then run bun run seed:admin again.`,
			1,
		);
	}

	if (existingUser.role === "admin") {
		exitWith(`${adminEmail} is already an admin.`, 0);
	}

	await db
		.update(user)
		.set({ role: "admin" })
		.where(eq(user.id, existingUser.id));
	exitWith(`${adminEmail} is now an admin.`, 0);
};

await seedAdmin();
