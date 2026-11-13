import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = React.ComponentProps<typeof Avatar> & {
	user: { name?: string | null; email: string; image?: string | null };
};

const getInitials = (name: string | null | undefined, email: string) => {
	const source = name?.trim() || email;
	const words = source.split(/[\s@._-]+/).filter(Boolean);
	const initials =
		words.length > 1 ? words[0][0] + words[1][0] : source.slice(0, 2);
	return initials.toUpperCase();
};

// provider image when present, initials otherwise
const UserAvatar = ({ user, ...props }: UserAvatarProps) => (
	<Avatar data-slot="user-avatar" {...props}>
		{user.image && (
			<AvatarImage src={user.image} alt="" referrerPolicy="no-referrer" />
		)}
		<AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
	</Avatar>
);

export { UserAvatar };
