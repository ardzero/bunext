import { ADMIN_ROLES, hasRole, parseRoles } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { canViewFeature } from "@/lib/utils/featureFlags";
import { UserButtonMenu } from "./user-button-menu";

type UserButtonProps = Omit<
	React.ComponentProps<typeof UserButtonMenu>,
	"user" | "roles" | "isAdmin" | "showThemeToggle"
>;

// Server component: avatar trigger with the account menu. Renders nothing when signed out.
const UserButton = async (props: UserButtonProps) => {
	const session = await getSession();
	if (!session) return null;

	const { name, email, image, role } = session.user;
	const showThemeToggle = Boolean(
		canViewFeature("NEXT_THEME") && canViewFeature("THEME_BUTTON"),
	);

	return (
		<UserButtonMenu
			user={{ name, email, image }}
			roles={parseRoles(role)}
			isAdmin={hasRole(role, ADMIN_ROLES)}
			showThemeToggle={showThemeToggle}
			{...props}
		/>
	);
};

export { UserButton };
