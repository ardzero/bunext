import Link from "next/link";
import { Home } from "@/components/Home";
import { SignedIn, SignedOut } from "@/components/auth/signed-in";
import { UserButton } from "@/components/auth/user-button";
import { Button } from "@/components/ui/button";

export default function Page() {
	return (
		<>
			<header className="fixed top-3 right-3 z-50 flex items-center gap-2">
				<SignedOut>
					<Button variant="outline" asChild>
						<Link href="/sign-in">Sign in</Link>
					</Button>
				</SignedOut>
				<SignedIn>
					<UserButton />
				</SignedIn>
			</header>
			<Home />
		</>
	);
}
