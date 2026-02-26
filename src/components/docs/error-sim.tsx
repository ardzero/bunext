"use client";
// this is used to simulate an error in the production environment to check global error handling
import "@/styles/globals.css";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export const ErrorSimulator = ({
	message = "This is a simulated error",
	className,
}: {
	message?: string;
	className?: string;
}) => {
	const [error, setError] = useState(false);
	if (error) throw new Error(message);

	return (
		<Button
			onClick={() => setError(true)}
			className={cn("mx-auto mt-24 flex justify-center", className)}
		>
			Simulate Error
		</Button>
	);
};
