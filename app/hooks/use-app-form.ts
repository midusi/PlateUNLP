import { createFormHook } from "@tanstack/react-form"
import { PasswordField } from "~/components/forms/password-field"
import { SelectUsersField } from "~/components/forms/select-users-field"
import { SettingsField } from "~/components/forms/settings-field"
import { TextField } from "~/components/forms/text-field"
import { fieldContext, formContext } from "~/hooks/use-app-form-context"

export const { useAppForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField,
    PasswordField,
    SettingsField,
    SelectUsersField,
  },
  formComponents: {},
  fieldContext,
  formContext,
})
