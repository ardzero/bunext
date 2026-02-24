"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { codeToHtml, type ShikiTransformer } from "shiki";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/utils/copy";
// to pick themes visit:
//https://textmate-grammars-themes.netlify.app/?theme=kanagawa-wave&grammar=javascript
const CODE_BLOCK_THEME = {
	defaultLanguage: "text",
	shiki: {
		light: "github-light",
		dark: "github-dark-default",
	},
	useShikiBg: false,
	lineColors: {
		highlight: {
			light: { bg: "#bfdbfe99", border: "#3b82f6", text: "#1e40af" },
			dark: { bg: "#1d4ed83d", border: "#60a5fa", text: "#93c5fd" },
		},
		added: {
			light: { bg: "#bbf7d099", border: "#16a34a", text: "#166534" },
			dark: { bg: "#22c55e10", border: "#22c55e", text: "#4ade80" },
		},
		removed: {
			light: { bg: "#fecaca99", border: "#ef4444", text: "#991b1b" },
			dark: { bg: "#ef444410", border: "#ef4444", text: "#f87171" },
		},
	},
} as const;

type CodeBlockProps = {
	code: string;
	language?: string;
	filename?: string;
	highlightLines?: number[];
	addedLines?: number[];
	removedLines?: number[];
	showCopyButton?: boolean;
	showLineNumbers?: boolean;
	className?: string;
	useShikiBg?: boolean;
};

type LineMarkerOpts = {
	highlightLines?: number[];
	addedLines?: number[];
	removedLines?: number[];
};

// helper functions
function escapeHtml(raw: string) {
	return raw.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function getLineMarkerClasses(
	lineNum: number,
	opts?: LineMarkerOpts,
): string[] {
	const classes: string[] = [];
	if (opts?.highlightLines?.includes(lineNum)) classes.push("highlighted");
	if (opts?.addedLines?.includes(lineNum)) classes.push("added");
	if (opts?.removedLines?.includes(lineNum)) classes.push("removed");
	return classes;
}

/** Fallback HTML with .line structure and line-marker classes so layout (padding, line numbers, bars) matches Shiki and avoids CLS. */
function buildFallbackHtml(code: string, opts?: LineMarkerOpts): string {
	const lines = code.split(/\r?\n/);
	const lineSpans = lines
		.map((line, i) => {
			const lineNum = i + 1;
			const classes = ["line", ...getLineMarkerClasses(lineNum, opts)];
			return `<span class="${classes.join(" ")}">${escapeHtml(line)}</span>`;
		})
		.join("\n");
	return `<pre><code>${lineSpans}</code></pre>`;
}

function lineClassTransformer(opts?: LineMarkerOpts): ShikiTransformer {
	return {
		name: "line-classes",
		line(node, line) {
			const markerClasses = getLineMarkerClasses(line, opts);
			if (markerClasses.length) {
				node.properties.class =
					((node.properties.class as string) || "") +
					" " +
					markerClasses.join(" ");
			}
			return node;
		},
	};
}

export function CodeBlock({
	code,
	language = CODE_BLOCK_THEME.defaultLanguage,
	filename,
	highlightLines,
	addedLines,
	removedLines,
	showCopyButton = true,
	showLineNumbers = true,
	className,
	useShikiBg = CODE_BLOCK_THEME.useShikiBg,
}: CodeBlockProps) {
	const [html, setHtml] = useState<string>("");
	const [loaded, setLoaded] = useState(false);
	const { resolvedTheme } = useTheme();
	const colorScheme = resolvedTheme === "light" ? "light" : "dark";

	const lineCount = code.trim().split(/\r?\n/).length;
	const effectiveShowLineNumbers = showLineNumbers && lineCount > 1;

	const hasLineMarkers =
		!!highlightLines?.length || !!addedLines?.length || !!removedLines?.length;

	const highlightKey = JSON.stringify(highlightLines);
	const addedKey = JSON.stringify(addedLines);
	const removedKey = JSON.stringify(removedLines);

	const transformer = useMemo(
		() =>
			hasLineMarkers
				? lineClassTransformer({ highlightLines, addedLines, removedLines })
				: null,
		// Stable deps: compare array values (keys) not references
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[highlightKey, addedKey, removedKey],
	);

	const highlight = useCallback(async () => {
		try {
			const out = await codeToHtml(code, {
				lang: language,
				themes: {
					light: CODE_BLOCK_THEME.shiki.light,
					dark: CODE_BLOCK_THEME.shiki.dark,
				},
				defaultColor: colorScheme,
				structure: "classic",
				transformers: transformer ? [transformer] : [],
			});
			setHtml(out);
		} catch {
			setHtml(
				buildFallbackHtml(code, {
					highlightLines,
					addedLines,
					removedLines,
				}),
			);
		} finally {
			setLoaded(true);
		}
	}, [
		code,
		language,
		transformer,
		colorScheme,
		highlightLines,
		addedLines,
		removedLines,
	]);

	useEffect(() => {
		highlight();
	}, [highlight]);

	const initialFallbackHtml = useMemo(
		() =>
			buildFallbackHtml(code, {
				highlightLines,
				addedLines,
				removedLines,
			}),
		// Stable deps: compare array values (keys) not references
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[code, highlightKey, addedKey, removedKey],
	);

	const fallbackHtml = !loaded ? initialFallbackHtml : html;

	return (
		<div
			className={cn(
				"code-block relative overflow-hidden rounded-lg border border-border bg-card text-[13px] shadow-sm",
				className,
			)}
			data-slot="code-block"
		>
			{/* Header bar */}
			{(filename || (showCopyButton && filename)) && (
				<div className="flex items-center border-b border-border bg-muted px-4 py-2">
					<span className="font-mono text-xs text-muted-foreground">
						{filename}
					</span>
					{showCopyButton && (
						<div className="ml-auto">
							<CopyButton
								copyContent={code}
								variant="ghost"
								size="icon-xs"
								className="text-muted-foreground hover:text-foreground"
								iconClassName="size-3.5!"
							/>
						</div>
					)}
				</div>
			)}

			{/* Code area */}
			<div
				className={cn("overflow-x-auto", showCopyButton && !filename && "pr-6")}
			>
				<div
					className={cn(
						// pre/code resets
						"[&_pre]:m-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:px-0 [&_pre]:py-2",
						!useShikiBg && "[&_code]:bg-transparent! [&_pre]:bg-transparent!",
						"[&_code]:block [&_code]:w-fit [&_code]:min-w-full [&_code]:font-mono",
						// .line base — compact line spacing (Geist-like)
						"[&_.line]:min-h-[1.05em] [&_.line]:items-center [&_.line]:pr-4 [&_.line]:leading-[1.05em]",
						// line numbers via CSS counter (hidden for single line)
						effectiveShowLineNumbers && [
							"[&_code]:[counter-reset:line]",
							"[&_.line]:[counter-increment:line]",
							"[&_.line]:before:inline-block [&_.line]:before:w-[3.5ch] [&_.line]:before:shrink-0 [&_.line]:before:pr-4 [&_.line]:before:pl-4 [&_.line]:before:text-right [&_.line]:before:tabular-nums [&_.line]:before:content-[counter(line)] [&_.line]:before:select-none",
							"[&_.line]:before:text-muted-foreground",
						],
						!effectiveShowLineNumbers && "[&_.line]:pl-4",
						// line markers (colors from CSS vars set below)
						"[&_.highlighted]:relative [&_.highlighted]:bg-(--cb-hl-bg) [&_.highlighted]:before:border-l-2 [&_.highlighted]:before:border-(--cb-hl-border) [&_.highlighted]:before:text-(--cb-hl-text)",
						"[&_.added]:relative [&_.added]:bg-(--cb-add-bg) [&_.added]:before:border-l-2 [&_.added]:before:border-(--cb-add-border) [&_.added]:before:text-(--cb-add-text)",
						"[&_.removed]:relative [&_.removed]:bg-(--cb-rem-bg) [&_.removed]:before:border-l-2 [&_.removed]:before:border-(--cb-rem-border) [&_.removed]:before:text-(--cb-rem-text)",
					)}
					style={
						{
							"--cb-hl-bg":
								CODE_BLOCK_THEME.lineColors.highlight[colorScheme].bg,
							"--cb-hl-border":
								CODE_BLOCK_THEME.lineColors.highlight[colorScheme].border,
							"--cb-hl-text":
								CODE_BLOCK_THEME.lineColors.highlight[colorScheme].text,
							"--cb-add-bg": CODE_BLOCK_THEME.lineColors.added[colorScheme].bg,
							"--cb-add-border":
								CODE_BLOCK_THEME.lineColors.added[colorScheme].border,
							"--cb-add-text":
								CODE_BLOCK_THEME.lineColors.added[colorScheme].text,
							"--cb-rem-bg":
								CODE_BLOCK_THEME.lineColors.removed[colorScheme].bg,
							"--cb-rem-border":
								CODE_BLOCK_THEME.lineColors.removed[colorScheme].border,
							"--cb-rem-text":
								CODE_BLOCK_THEME.lineColors.removed[colorScheme].text,
						} as React.CSSProperties
					}
					dangerouslySetInnerHTML={{ __html: fallbackHtml }}
				/>
			</div>

			{/* Floating copy button when no filename header */}
			{showCopyButton && !filename && (
				<div
					className={cn(
						"absolute right-1.5",
						lineCount === 1 ? "top-1/2 -translate-y-1/2" : "top-2",
					)}
				>
					<CopyButton
						copyContent={code}
						variant="ghost"
						size="icon-xs"
						className="text-muted-foreground hover:bg-muted hover:text-foreground"
						iconClassName="size-3.5!"
					/>
				</div>
			)}
		</div>
	);
}
