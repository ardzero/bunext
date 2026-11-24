import { getPlaceholderImage } from "@/actions/blur-placeholder";
import { Image, toSrcString, type BunextImageProps } from "./image";

export const BlurImage = async (
	props: Omit<BunextImageProps, "placeholder" | "blurDataURL">,
) => {
	const blurDataURL = await getPlaceholderImage(toSrcString(props.src));
	return (
		<Image
			{...props}
			alt={props.alt ?? ""}
			placeholder="blur"
			blurDataURL={blurDataURL}
		/>
	);
};
