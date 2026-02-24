/**
 * Wrapper around next/image that adds:
 * - Optional alt (defaults: filename-based or "Picture Element")
 * - Width/height: if only width passed, height is derived from image aspect ratio; if neither passed, dimensions are inferred from the image (static import or server-side). If inference is not possible, width and height are required.
 * - cleanSrc: strips /public/ prefix from string srcs
 * - placeholder API: "blur" (server-generated blur hash), "shimmer" (SVG data URL), or custom data:image/... URL
 */
import type React from "react";
import NextImageComponent from "next/image";
import type { ImageProps } from "next/image";
import { getImageDimensions } from "@/actions/placeholder";
import { shimmer, svgToBase64 } from "@/lib/utils";

type ImgProps = Omit<ImageProps, "alt" | "width" | "height" | "placeholder"> & {
	alt?: string;
	width?: number;
	height?: number;
	placeholder?: "blur" | "color" | "shimmer" | "empty" | `data:image/${string}`;
};

type ImgPropsWithDimensions = Omit<ImgProps, "width" | "height"> & {
	width: number;
	height: number;
};

const cleanSrc = (src: string): string => {
	if (src.includes("/public/")) return src.replace("/public/", "/");
	return src;
};

const toSrcString = (src: ImageProps["src"]): string =>
	typeof src === "string" ? src : "default" in src ? src.default.src : src.src;

const getStaticDimensions = (
	src: ImageProps["src"],
): { width: number; height: number } | null => {
	if (typeof src === "string") return null;
	const data = "default" in src ? src.default : src;
	const w = data.width;
	const h = data.height;
	if (typeof w !== "number" || typeof h !== "number") return null;
	return { width: w, height: h };
};

const resolveDimensions = async (
	props: ImgProps,
): Promise<{ width: number; height: number }> => {
	const { src, width: w, height: h } = props;
	const staticDims = getStaticDimensions(src);

	if (w != null && h != null) return { width: w, height: h };

	const intrinsic: { width: number; height: number } | null =
		staticDims ?? (await getImageDimensions(toSrcString(src)));
	if (intrinsic == null) {
		throw new Error(
			"Could not infer image dimensions. Pass width and height explicitly.",
		);
	}
	const iw = intrinsic.width;
	const ih = intrinsic.height;

	if (w != null) return { width: w, height: Math.round((w / iw) * ih) };
	if (h != null) return { width: Math.round((h / ih) * iw), height: h };
	return { width: iw, height: ih };
};

const Img = ({ src, width, height, alt, ...props }: ImgPropsWithDimensions) => {
	const srcStr = toSrcString(src);
	return (
		<NextImageComponent
			width={width}
			height={height}
			alt={
				alt ||
				srcStr.substring(srcStr.lastIndexOf("/") + 1).slice(0, 20) ||
				"Picture Element"
			}
			src={typeof src === "string" ? cleanSrc(src) : src}
			draggable="false"
			sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
			{...(props as any)}
		/>
	);
};

const BlurImg = async (props: ImgPropsWithDimensions) => {
	const { getPlaceholderImage } = await import("@/actions/placeholder");
	const blurDataURL = await getPlaceholderImage(toSrcString(props.src));
	return (
		<Img
			{...props}
			placeholder="blur"
			blurDataURL={blurDataURL}
			alt={props.alt || ""}
		/>
	);
};

/**
 * Next/image wrapper with optional alt/width/height, dimension inference, and placeholder presets.
 *
 * @param props - See {@link ImgProps}
 * @param props.src - Image URL or static import (required)
 * @param props.alt - Optional. Defaults to filename (first 20 chars) or "Picture Element"
 * @param props.width - Optional. If set alone, height is derived from image aspect ratio
 * @param props.height - Optional. If set alone, width is derived from image aspect ratio
 * @param props.placeholder - Optional. "blur" (server blur), "shimmer" (SVG), or a data:image/... URL
 * @returns Promise that resolves to the rendered image (use in Server Components or with Suspense)
 * @throws Error when dimensions cannot be inferred and neither width nor height is provided
 *
 * @example
 *  Inferred dimensions (static import or server-side)
 * <Image src="/hero.jpg" />
 *
 * @example
 *  Width only; height from aspect ratio
 * <Image src="/hero.jpg" width={800} />
 *
 * @example
 *  Blur placeholder
 * <Image src="/hero.jpg" width={800} height={600} placeholder="blur" />
 */
export const Image = async (props: ImgProps) => {
	const { width, height } = await resolveDimensions(props);
	const resolvedProps: ImgPropsWithDimensions = { ...props, width, height };
	const imgComp: Record<string, React.ReactNode> = {
		blur: <BlurImg {...resolvedProps} />,
		shimmer: (
			<Img
				{...resolvedProps}
				placeholder={`data:image/svg+xml;base64,${svgToBase64(
					shimmer(500, 300),
				)}`}
				alt={props.alt || ""}
			/>
		),
	};
	return (
		(props.placeholder && imgComp[props.placeholder]) || (
			<Img {...resolvedProps} alt={props.alt || ""} />
		)
	);
};
