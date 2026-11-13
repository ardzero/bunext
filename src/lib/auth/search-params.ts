export type SearchParams = Promise<
	Record<string, string | string[] | undefined>
>;

// first value of a query param, or null
export const getParam = (
	params: Record<string, string | string[] | undefined>,
	key: string,
) => {
	const value = params[key];
	const first = Array.isArray(value) ? value[0] : value;
	return first || null;
};
