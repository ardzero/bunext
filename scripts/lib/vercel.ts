// Pushes the runtime variables a Vercel deployment needs to the linked project,
// so preview and production deployments don't fail on a missing secret or
// database. Used by `bun run setup` and `bun run setup:vercel`. Safe to run
// again: a variable that is already set for a target is never overwritten.
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
	ask,
	canPrompt,
	done,
	fail,
	generateSecret,
	isPostgresUrl,
	migrateDatabase,
	note,
	step,
	withDatabase,
} from "./cli";

const TARGETS = ["preview", "production"] as const;
type Target = (typeof TARGETS)[number];

type EnvVariable = { key: string; value: string; sensitive: boolean };

type VercelEnvList = {
	envs: { key: string; target?: string | string[]; gitBranch?: string }[];
};

// values go through stdin, so secrets never show up in the process list
const runVercel = (args: string[], input?: string) => {
	const result = Bun.spawnSync(["vercel", ...args], {
		stdin: input === undefined ? "ignore" : new TextEncoder().encode(input),
		stdout: "pipe",
		stderr: "pipe",
	});
	return {
		ok: result.exitCode === 0,
		stdout: result.stdout.toString(),
		stderr: result.stderr.toString().trim(),
	};
};

const ensureLinked = () => {
	if (existsSync(join(process.cwd(), ".vercel", "project.json"))) {
		return done("project is linked");
	}

	const { exitCode } = Bun.spawnSync(["vercel", "link"], {
		stdio: ["inherit", "inherit", "inherit"],
	});
	if (exitCode !== 0) fail("`vercel link` failed; link the project and retry.");
	done("project linked");
};

// keys set for every deployment of `target` (branch-only values don't count)
const listVariables = (target: Target) => {
	const { ok, stdout, stderr } = runVercel(["env", "ls", target, "--json"]);
	if (!ok) fail(`Could not list ${target} variables: ${stderr}`);

	const { envs } = JSON.parse(stdout) as VercelEnvList;
	return new Set(
		envs
			.filter((env) => !env.gitBranch && [env.target].flat().includes(target))
			.map((env) => env.key),
	);
};

const addVariable = (
	target: Target,
	{ key, value, sensitive }: EnvVariable,
) => {
	const { ok, stderr } = runVercel(
		[
			"env",
			"add",
			key,
			target,
			sensitive ? "--sensitive" : "--no-sensitive",
			"--yes",
		],
		value,
	);
	if (!ok) fail(`Could not add ${key} to ${target}: ${stderr}`);
	done(`${target}: added ${key}`);
};

// each target gets its own secret, so a leaked preview secret can't forge
// production sessions
const secretVariables = (existing: Set<string>): EnvVariable[] =>
	existing.has("BETTER_AUTH_SECRET")
		? []
		: [{ key: "BETTER_AUTH_SECRET", value: generateSecret(), sensitive: true }];

// asks for the target's database and migrates it before the URL is saved
const databaseVariables = async (
	target: Target,
	existing: Set<string>,
): Promise<EnvVariable[]> => {
	if (existing.has("DATABASE_URL")) {
		note(
			`${target}: DATABASE_URL is already set; migrate it with \`bun run db:migrate\` if you haven't`,
		);
		return [];
	}

	const databaseUrl = ask(
		`${target} Postgres URL (its own database or branch, not your local one; Enter to skip):`,
	);
	if (!databaseUrl) {
		note(`${target}: skipped; its deployments fail until DATABASE_URL is set`);
		return [];
	}
	if (!isPostgresUrl(databaseUrl)) {
		fail("That is not a Postgres URL; it should start with postgres://.");
	}

	try {
		await withDatabase(databaseUrl, migrateDatabase);
		done(`${target}: migrations applied`);
	} catch (error) {
		fail(`${target} migrations failed: ${(error as Error).message}`);
	}

	return [{ key: "DATABASE_URL", value: databaseUrl, sensitive: true }];
};

// production (previews included) refuses to start without a mailer decision
const mailerVariables = (
	target: Target,
	existing: Set<string>,
): EnvVariable[] => {
	if (existing.has("ALLOW_NO_MAILER")) return [];

	// asks only for what's missing, so an interrupted run can be finished
	const variables: EnvVariable[] = [];
	if (!existing.has("RESEND_API_KEY")) {
		const apiKey = ask(
			`${target} Resend API key (Enter to run without email):`,
		);
		if (!apiKey) {
			note(`${target}: no mailer, so password reset and magic links are off`);
			return [{ key: "ALLOW_NO_MAILER", value: "true", sensitive: false }];
		}
		variables.push({ key: "RESEND_API_KEY", value: apiKey, sensitive: true });
	}
	if (!existing.has("MAIL_FROM")) {
		const mailFrom = ask(`${target} sender, e.g. "App <auth@example.com>":`);
		if (!mailFrom) fail("MAIL_FROM is required with a Resend API key.");
		variables.push({ key: "MAIL_FROM", value: mailFrom, sensitive: false });
	}
	return variables;
};

const setupTarget = async (target: Target) => {
	const existing = listVariables(target);
	const variables = [
		...secretVariables(existing),
		...(await databaseVariables(target, existing)),
		...mailerVariables(target, existing),
	];
	if (!variables.length) return done(`${target}: nothing to add`);

	for (const variable of variables) addVariable(target, variable);
};

export const setupVercel = async ({ askFirst }: { askFirst: boolean }) => {
	step("Vercel environment variables");
	if (!canPrompt) {
		return note("skipped (needs a terminal); run `bun run setup:vercel`");
	}
	if (!Bun.which("vercel")) {
		return note(
			"Vercel CLI not found; install it (`bun add -g vercel`), then run `bun run setup:vercel`",
		);
	}
	if (askFirst) {
		const answer = ask("Push the secret, database and mail settings? (y/N)");
		if (!/^y(es)?$/i.test(answer)) {
			return note("skipped; run `bun run setup:vercel` any time");
		}
	}

	ensureLinked();
	for (const target of TARGETS) await setupTarget(target);
	note(
		"BETTER_AUTH_URL falls back to the Vercel domains; keep “Automatically expose System Environment Variables” on, or set it yourself (https only).",
	);
	note("Redeploy (or push a commit) so deployments pick up the new values.");
};
