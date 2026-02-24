"use client";

export default function TestErrorPage() {
	const handleTriggerError = () => {
		throw new Error("Global error simulator — triggered on click");
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
			<h1 className="text-2xl font-bold">Global error simulator</h1>
			<p className="text-center text-muted-foreground">
				Click the button to trigger the error boundary.
			</p>
			<button
				type="button"
				onClick={handleTriggerError}
				className="rounded-md bg-destructive px-4 py-2 font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
				aria-label="Trigger global error"
			>
				Trigger error
			</button>
		</div>
	);
}
