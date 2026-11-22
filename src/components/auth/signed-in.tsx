import { getSession } from "@/lib/auth/session";

type SessionGateProps = { children: React.ReactNode };

// Server components. Use them to show or hide UI only; protect data with
// requireSession() / requireRole().
const SignedIn = async ({ children }: SessionGateProps) => {
	const session = await getSession();
	if (!session) return null;
	return children;
};

const SignedOut = async ({ children }: SessionGateProps) => {
	const session = await getSession();
	if (session) return null;
	return children;
};

export { SignedIn, SignedOut };
