// Runs once when the server starts. Node-only work lives in instrumentation-node.ts.
export const register = async () => {
	if (process.env.NEXT_RUNTIME !== "nodejs") return;
	await import("./instrumentation-node");
};
