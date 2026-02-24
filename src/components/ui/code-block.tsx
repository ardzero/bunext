"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { codeToHtml, type ShikiTransformer } from "shiki";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/utils/copy";

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
};

const DEFAULT_LANG = "text";

function escapeHtml(raw: string) {
	return raw.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function lineClassTransformer(
	highlightLines?: number[],
	addedLines?: number[],
	removedLines?: number[],
): ShikiTransformer {
	const highlights = new Set(highlightLines);
	const added = new Set(addedLines);
	const removed = new Set(removedLines);

	return {
		name: "line-classes",
		line(node, line) {
			const classes: string[] = [];
			if (highlights.has(line)) classes.push("highlighted");
			if (added.has(line)) classes.push("added");
			if (removed.has(line)) classes.push("removed");
			if (classes.length) {
				node.properties.class =
					((node.properties.class as string) || "") + " " + classes.join(" ");
			}
			return node;
		},
	};
}

export function CodeBlock({
	code,
	language = DEFAULT_LANG,
	filename,
	highlightLines,
	addedLines,
	removedLines,
	showCopyButton = true,
	showLineNumbers = true,
	className,
}: CodeBlockProps) {
	const [html, setHtml] = useState<string>("");
	const [loaded, setLoaded] = useState(false);
	const { resolvedTheme } = useTheme();

	const hasLineMarkers =
		!!highlightLines?.length || !!addedLines?.length || !!removedLines?.length;

	const highlightKey = JSON.stringify(highlightLines);
	const addedKey = JSON.stringify(addedLines);
	const removedKey = JSON.stringify(removedLines);

	const transformer = useMemo(
		() =>
			hasLineMarkers
				? lineClassTransformer(highlightLines, addedLines, removedLines)
				: null,
		// Stable deps: compare array values (keys) not references
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[highlightKey, addedKey, removedKey],
	);

	const highlight = useCallback(async () => {
		const colorScheme = resolvedTheme === "light" ? "light" : "dark";
		try {
			const out = await codeToHtml(code, {
				lang: language,
				themes: {
					light: "vitesse-light",
					dark: "vitesse-dark",
				},
				defaultColor: colorScheme,
				structure: "classic",
				transformers: transformer ? [transformer] : [],
			});
			setHtml(out);
		} catch {
			setHtml(`<pre><code>${escapeHtml(code)}</code></pre>`);
		} finally {
			setLoaded(true);
		}
	}, [code, language, transformer, resolvedTheme]);

	useEffect(() => {
		highlight();
	}, [highlight]);

	const fallbackHtml = !loaded
		? `<pre><code>${escapeHtml(code)}</code></pre>`
		: html;

	return (
		<div
			className={cn(
				"code-block relative overflow-hidden rounded-lg border bg-gray-50 text-[13px] shadow-sm dark:border-white/8 dark:bg-[#111]",
				"border-gray-200",
				className,
			)}
			data-slot="code-block"
		>
			{/* Header bar */}
			{(filename || (showCopyButton && filename)) && (
				<div className="flex items-center border-b border-gray-200 bg-gray-100/80 px-4 py-2 dark:border-white/8 dark:bg-white/3">
					<span className="font-mono text-xs text-gray-600 dark:text-[#888]">{filename}</span>
					{showCopyButton && (
						<div className="ml-auto">
							<CopyButton
								copyContent={code}
								variant="ghost"
								size="icon-xs"
								className="text-gray-500 hover:text-gray-700 dark:text-[#666] dark:hover:text-[#999]"
								iconClassName="size-3.5!"
							/>
						</div>
					)}
				</div>
			)}

			{/* Code area */}
			<div className="overflow-x-auto">
				<div
					className={cn(
						// pre/code resets
						"[&_pre]:m-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:px-0 [&_pre]:py-2",
						"[&_code]:block [&_code]:w-fit [&_code]:min-w-full [&_code]:font-mono",
						// .line base — compact line spacing (Geist-like)
						"[&_.line]:min-h-[1.05em] [&_.line]:items-center [&_.line]:pr-4 [&_.line]:leading-[1.05em]",
						// line numbers via CSS counter
						showLineNumbers && [
							"[&_code]:[counter-reset:line]",
							"[&_.line]:[counter-increment:line]",
							"[&_.line]:before:inline-block [&_.line]:before:w-[3.5ch] [&_.line]:before:shrink-0 [&_.line]:before:pr-4 [&_.line]:before:pl-4 [&_.line]:before:text-right [&_.line]:before:tabular-nums [&_.line]:before:content-[counter(line)] [&_.line]:before:select-none",
							"[&_.line]:before:text-gray-400 dark:[&_.line]:before:text-[#555]",
						],
						!showLineNumbers && "[&_.line]:pl-4",
						// highlighted line
						"[&_.highlighted]:relative [&_.highlighted]:before:border-l-2",
						"[&_.highlighted]:bg-blue-200/60 [&_.highlighted]:before:border-blue-500 [&_.highlighted]:before:text-blue-800 dark:[&_.highlighted]:bg-[#1d4ed8]/12 dark:[&_.highlighted]:before:border-[#3b82f6] dark:[&_.highlighted]:before:text-[#6b8acd]",
						// added line
						"[&_.added]:relative [&_.added]:before:border-l-2",
						"[&_.added]:bg-green-200/60 [&_.added]:before:border-green-600 [&_.added]:before:text-green-800 dark:[&_.added]:bg-[#22c55e]/10 dark:[&_.added]:before:border-[#22c55e] dark:[&_.added]:before:text-[#4ade80]",
						// removed line
						"[&_.removed]:relative [&_.removed]:before:border-l-2",
						"[&_.removed]:bg-red-200/60 [&_.removed]:before:border-red-500 [&_.removed]:before:text-red-800 dark:[&_.removed]:bg-[#ef4444]/10 dark:[&_.removed]:before:border-[#ef4444] dark:[&_.removed]:before:text-[#f87171]",
					)}
					dangerouslySetInnerHTML={{ __html: fallbackHtml }}
				/>
			</div>

			{/* Floating copy button when no filename header */}
			{showCopyButton && !filename && (
				<div className="absolute right-2 top-2">
					<CopyButton
						copyContent={code}
						variant="ghost"
						size="icon-xs"
						className="text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-[#666] dark:hover:bg-white/8 dark:hover:text-[#999]"
						iconClassName="size-3.5!"
					/>
				</div>
			)}
		</div>
	);
}
