"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import type { z } from "zod";
import { getAuthErrorMessage, type AuthErrorLike } from "./auth-error";

type FormValues = Record<string, unknown>;

type UseAuthFormOptions<TSchema extends z.ZodType<FormValues>> = {
	schema: TSchema;
	onSubmit: (values: z.output<TSchema>, form: HTMLFormElement) => Promise<void>;
};

// focus the first field (in DOM order) that has an error, after it re-renders
const focusFirstInvalid = (form: HTMLFormElement, names: string[]) => {
	requestAnimationFrame(() => {
		const firstInvalid = Array.from(form.elements).find(
			(element): element is HTMLInputElement =>
				element instanceof HTMLInputElement && names.includes(element.name),
		);
		firstInvalid?.focus();
	});
};

const collectFieldErrors = (issues: z.core.$ZodIssue[]) => {
	const errors: Record<string, string> = {};
	for (const issue of issues) {
		const name = String(issue.path[0] ?? "");
		errors[name] ??= issue.message;
	}
	return errors;
};

// Shared form state for auth forms: zod validation before submit, inline field
// errors linked with aria-describedby, a form-level error, focus on the first
// invalid field and a pending state from useTransition.
export const useAuthForm = <TSchema extends z.ZodType<FormValues>>({
	schema,
	onSubmit,
}: UseAuthFormOptions<TSchema>) => {
	const formId = useId();
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const fieldId = (name: string) => `${formId}-${name}`;
	const errorId = (name: string) => `${formId}-${name}-error`;

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		const result = schema.safeParse(Object.fromEntries(new FormData(form)));

		setFormError(null);
		if (!result.success) {
			const errors = collectFieldErrors(result.error.issues);
			setFieldErrors(errors);
			focusFirstInvalid(form, Object.keys(errors));
			return;
		}

		setFieldErrors({});
		startTransition(async () => {
			await onSubmit(result.data, form);
		});
	};

	// show a server error on one field, e.g. "email already in use"
	const setFieldError = (
		name: string,
		message: string,
		form?: HTMLFormElement,
	) => {
		setFieldErrors((current) => ({ ...current, [name]: message }));
		if (form) focusFirstInvalid(form, [name]);
	};

	const setAuthError = (error: string | AuthErrorLike | null | undefined) =>
		setFormError(getAuthErrorMessage(error));

	// spread onto the input
	const getFieldProps = (name: string) => ({
		id: fieldId(name),
		name,
		"aria-invalid": fieldErrors[name] ? true : undefined,
		"aria-describedby": fieldErrors[name] ? errorId(name) : undefined,
	});

	// spread onto <FieldError />
	const getErrorProps = (name: string) => ({
		id: errorId(name),
		children: fieldErrors[name],
	});

	return {
		isPending,
		formError,
		fieldErrors,
		fieldId,
		handleSubmit,
		setFieldError,
		setFormError,
		setAuthError,
		getFieldProps,
		getErrorProps,
	};
};
