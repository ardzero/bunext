import type { Graph, Thing, WithContext } from "schema-dts";

/**
 * Renders JSON-LD structured data as a script tag.
 * Sanitizes payload (replaces `<` with `\u003c`) to prevent XSS per Next.js guidance.
 * @see https://nextjs.org/docs/app/guides/json-ld
 */
type JsonLdProps = {
	data: Graph | WithContext<Thing>;
};

export const JsonLd = ({ data }: JsonLdProps) => {
	const sanitized = JSON.stringify(data).replace(/</g, "\\u003c");
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: sanitized }}
		/>
	);
};
