import { FieldSelectComponent } from "./field-select";
import { FormActions } from "./form-actions";
import { FormFieldShell } from "./form-field";
import { FormPageHeader } from "./form-page-header";
import { FormSection } from "./form-section";
import { FormValidationSummary } from "./form-validation-summary";
import { IsoDateInputComponent } from "./iso-date-input";
import { IsoDatetimeInputComponent } from "./iso-datetime-input";
/** Shared imports for create / edit form pages. */
export const FORM_PAGE_IMPORTS = [
  FormActions,
  FieldSelectComponent,
  FormFieldShell,
  FormPageHeader,
  FormSection,
  FormValidationSummary,
  IsoDateInputComponent,
  IsoDatetimeInputComponent,
] as const;
