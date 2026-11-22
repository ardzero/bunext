"use client";

import { useEffect, useState } from "react";

// Counts down once per second after `start()`. The interval only runs while a
// cooldown is active; an effect is needed to tick and to clear it on unmount.
export const useCooldown = (seconds: number) => {
	const [secondsLeft, setSecondsLeft] = useState(0);
	const isCoolingDown = secondsLeft > 0;

	useEffect(() => {
		if (!isCoolingDown) return;
		const interval = setInterval(
			() => setSecondsLeft((left) => Math.max(left - 1, 0)),
			1000,
		);
		return () => clearInterval(interval);
	}, [isCoolingDown]);

	const start = () => setSecondsLeft(seconds);

	return { secondsLeft, isCoolingDown, start };
};
