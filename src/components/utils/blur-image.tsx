import { getPlaceholderImage } from "@/actions/blur-placeholder";
import { Image, toSrcString, type BunextImageProps } from "./image";

/**
 * Generates blur data on the server with Sharp when the source has none.
 * Give the page a distinct Vercel function configuration (for example,
 * export const maxDuration = 15) to keep its ~18 MB Sharp bundle out of
 * other pages Vercel would otherwise group into the same function.
 */
export const BlurImage = async (
	props: Omit<BunextImageProps, "placeholder" | "blurDataURL">,
) => {
	const { src } = props;
	const staticImage =
		typeof src === "string" ? undefined : "default" in src ? src.default : src;
	const blurDataURL =
		staticImage?.blurDataURL ?? (await getPlaceholderImage(toSrcString(src)));
	return (
		<Image
			{...props}
			alt={props.alt ?? ""}
			placeholder="blur"
			blurDataURL={blurDataURL}
		/>
	);
};
