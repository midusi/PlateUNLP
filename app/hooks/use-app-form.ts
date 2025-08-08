import { createFormHook } from "@tanstack/react-form"
import { TextField } from "~/components/forms/text-field"
import { fieldContext, formContext } from "~/hooks/use-app-form-context"

export const { useAppForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField,
  },
  formComponents: {},
  fieldContext,
  formContext,
})
