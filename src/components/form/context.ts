import { createFormHookContexts } from "@tanstack/react-form";

// The contexts TanStack Form needs for the kit's field and form components (see form.tsx).
export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();
