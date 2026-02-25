import { ImageResponse } from "next/og";

// Image metadata
export const size = {
	width: 1200,
	height: 630,
};

// Image generation
export async function GenerateImage(params: {
	title: string;
	description?: string;
}) {
	//   // Fonts
	//   const interSemiBold = fetch(
	//     new URL('../fonts/Inter-SemiBold.ttf', import.meta.url)
	//   ).then((res) => res.arrayBuffer())
	//   const interLight = fetch(
	//     new URL('../fonts/Inter-Light.ttf', import.meta.url)
	//   ).then((res) => res.arrayBuffer())

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(145deg, #0f0f12 0%, #1a1a24 40%, #16161d 100%)",
				fontFamily: "sans-serif",
				position: "relative",
			}}
		>
			{/* Corner accents */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 4,
					background: "linear-gradient(90deg, transparent 0%, #6366f1 20%, #8b5cf6 50%, #6366f1 80%, transparent 100%)",
					opacity: 0.9,
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 4,
					background: "linear-gradient(90deg, transparent 0%, #6366f1 20%, #8b5cf6 50%, #6366f1 80%, transparent 100%)",
					opacity: 0.9,
				}}
			/>
			{/* Content card */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					textAlign: "center",
					padding: 80,
					maxWidth: 900,
					gap: 24,
					border: "1px solid rgba(99, 102, 241, 0.2)",
					borderRadius: 24,
					backgroundColor: "rgba(15, 15, 18, 0.6)",
				}}
			>
				<span
					style={{
						fontSize: 72,
						fontWeight: 700,
						color: "white",
						letterSpacing: "-0.02em",
						lineHeight: 1.1,
					}}
				>
					{params.title}
				</span>
				{params.description ? (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 24,
						}}
					>
						<div
							style={{
								width: 64,
								height: 4,
								backgroundColor: "#6366f1",
								borderRadius: 2,
							}}
						/>
						<span
							style={{
								fontSize: 28,
								fontWeight: 400,
								color: "rgba(255, 255, 255, 0.7)",
								lineHeight: 1.4,
							}}
						>
							{params.description}
						</span>
					</div>
				) : null}
			</div>
		</div>,
		// ImageResponse options
		{
			// For convenience, we can re-use the exported opengraph-image
			// size config to also set the ImageResponse's width and height.
			...size,
			//   fonts: [
			//     {
			//       name: 'Inter',
			//       data: await interSemiBold,
			//       style: 'normal',
			//       weight: 600,
			//     },
			//     {
			//       name: 'Inter',
			//       data: await interLight,
			//       style: 'normal',
			//       weight: 300,
			//     },
			//   ],
		},
	);
}
