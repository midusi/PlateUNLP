import { createFormHook } from "@tanstack/react-form"
import { CheckboxField } from "~/components/forms/checkbox-field"
import { ImageField } from "~/components/forms/image-field"
import { NumberField } from "~/components/forms/number-field"
import { PasswordField } from "~/components/forms/password-field"
import { RangeField } from "~/components/forms/range-field"
import { SelectField } from "~/components/forms/select-field"
import { SelectFieldSimple } from "~/components/forms/select-field-simple"
import { SelectFieldSimpleWithKnown } from "~/components/forms/select-field-simple-with-known"
import { SelectUsersField } from "~/components/forms/select-users-field"
import { SettingsField } from "~/components/forms/settings-field"
import { TextField } from "~/components/forms/text-field"
import { fieldContext, formContext } from "~/hooks/use-app-form-context"

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField,
    NumberField,
    PasswordField,
    SettingsField,
    SelectUsersField,
    SelectField,
    SelectFieldSimple,
    CheckboxField,
    RangeField,
    ImageField,
  },
  formComponents: {},
  fieldContext,
  formContext,
})
