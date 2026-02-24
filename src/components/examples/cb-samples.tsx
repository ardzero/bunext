"use client";

import { useState } from "react";
import { Example, ExampleWrapper } from "@/components/examples/example";
import { CodeBlock } from "@/components/ui/custom/code-block";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const DEFAULT_REACT_CODE = `function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}`;

const NEXT_CONFIG_CODE = `module.exports = {
  experimental: {
    appDir: true,
  },
  appDir: true,
}`;

const LUA_SAMPLE = `local M = {}

function M.greet(name)
  print("Hello, " .. name .. "!")
end

return M`;

const BASH_SAMPLE = `bun create bunestro@latest`;

const LANGUAGES = [
	{ value: "javascript", label: "JavaScript" },
	{ value: "typescript", label: "TypeScript" },
	{ value: "tsx", label: "Next.js" },
	{ value: "lua", label: "Lua" },
] as const;

const LANGUAGE_SAMPLE: Record<(typeof LANGUAGES)[number]["value"], string> = {
	javascript: DEFAULT_REACT_CODE,
	typescript: DEFAULT_REACT_CODE.replace(
		"function MyComponent(props)",
		"function MyComponent(props: { name: string })",
	),
	tsx: DEFAULT_REACT_CODE,
	lua: LUA_SAMPLE,
};

export function CbSamples() {
	return (
		<ExampleWrapper className="flex flex-col gap-12 md:grid-cols-1">
			<Example title="Default" className="w-full max-w-2xl">
				<CodeBlock
					code={DEFAULT_REACT_CODE}
					language="tsx"
					filename="Table.jsx"
				/>
			</Example>

			<Example title="No filename" className="w-full max-w-2xl">
				<CodeBlock code={DEFAULT_REACT_CODE} language="tsx" />
			</Example>

			<Example title="Highlighted lines" className="w-full max-w-2xl">
				<CodeBlock
					code={DEFAULT_REACT_CODE}
					language="tsx"
					filename="highlighted.jsx"
					highlightLines={[2, 3, 4]}
				/>
			</Example>

			<Example title="Added & removed lines" className="w-full max-w-2xl">
				<CodeBlock
					code={NEXT_CONFIG_CODE}
					language="javascript"
					filename="next.config.js"
					removedLines={[2, 3, 4]}
					addedLines={[5]}
				/>
			</Example>

			<Example title="Referenced lines" className="w-full max-w-2xl">
				<p className="mb-2 text-xs text-muted-foreground">
					You can link to lines. Just press on any line number.
				</p>
				<CodeBlock
					code={`function MyComponent(props) {
  return (
    <div>
      <h1>Count: {props.count}</h1>
    </div>
  );
}`}
					language="tsx"
					filename="component.tsx"
				/>
			</Example>

			<Example title="Language switcher" className="w-full max-w-2xl">
				<LanguageSwitcherSample />
			</Example>

			<Example title="Bash" className="w-full max-w-2xl">
				<CodeBlock code={BASH_SAMPLE} language="bash" showCopyButton={false} />
			</Example>

			<Example title="Hidden line numbers" className="w-full max-w-2xl">
				<CodeBlock
					code={DEFAULT_REACT_CODE}
					language="tsx"
					filename="hidden-line-numbers.jsx"
					showLineNumbers={false}
				/>
			</Example>
		</ExampleWrapper>
	);
}

function LanguageSwitcherSample() {
	const [lang, setLang] =
		useState<(typeof LANGUAGES)[number]["value"]>("javascript");
	const code = LANGUAGE_SAMPLE[lang];

	return (
		<div className="flex w-full flex-col gap-3">
			<div className="flex items-center gap-2">
				<span className="text-xs font-medium text-muted-foreground">
					Language:
				</span>
				<Select
					value={lang}
					onValueChange={(v) =>
						setLang(v as (typeof LANGUAGES)[number]["value"])
					}
				>
					<SelectTrigger className="w-[140px]" aria-label="Select language">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{LANGUAGES.map((l) => (
							<SelectItem key={l.value} value={l.value}>
								{l.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<CodeBlock
				code={code}
				language={lang === "tsx" ? "tsx" : lang}
				filename="language-switcher.jsx"
			/>
		</div>
	);
}
