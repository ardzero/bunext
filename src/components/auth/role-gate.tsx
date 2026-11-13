import { hasRole, type Role } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";

type RoleGateProps = {
	role: Role | Role[];
	children: React.ReactNode;
	fallback?: React.ReactNode;
};

// Server component that shows children to users with one of the roles.
// For UI only: it does not replace requireRole() in pages, actions and routes.
const RoleGate = async ({ role, children, fallback = null }: RoleGateProps) => {
	const session = await getSession();
	if (!session || !hasRole(session.user.role, role)) return fallback;
	return children;
};

export { RoleGate };
