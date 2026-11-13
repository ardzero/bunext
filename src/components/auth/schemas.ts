import { z } from "zod";

// mirrors Better Auth's defaults (minPasswordLength 8, maxPasswordLength 128)
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z.email("Enter a valid email address.");

export const passwordSchema = z
	.string()
	.min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
	.max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`);

export const nameSchema = z
	.string()
	.trim()
	.min(1, "Enter your name.")
	.max(100, "Name is too long.");
