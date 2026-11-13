// Shared centered layout for the sign-in, sign-up and recovery pages.
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
	<div className="flex min-h-svh w-full items-center justify-center px-4 py-10">
		<div className="w-full max-w-sm">{children}</div>
	</div>
);

export default AuthLayout;
