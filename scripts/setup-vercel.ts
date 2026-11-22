// Pushes the variables Vercel deployments need to the linked project and
// migrates the databases you enter. Safe to run again.
// Usage: bun run setup:vercel
import { setupVercel } from "./lib/vercel";

await setupVercel({ askFirst: false });
