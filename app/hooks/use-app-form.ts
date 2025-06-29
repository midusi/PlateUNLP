import { createFormHook } from "@tanstack/react-form"
import TextField from "~/components/forms/TextField"
import { fieldContext, formContext } from "~/hooks/use-app-form-context"

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
  },
  formComponents: {},
  fieldContext,
  formContext,
})
