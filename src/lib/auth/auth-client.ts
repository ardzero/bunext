import { adminClient, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// same-origin client: the base URL is taken from the browser
export const authClient = createAuthClient({
	plugins: [adminClient(), magicLinkClient()],
});
