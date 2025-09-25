import * as yup from "yup";

export const companySchema = yup.object().shape({
  companyName: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .notRequired(),

  companyEmail: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
    .notRequired(),

  companyPhone: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .matches(/^\+?[0-9\s\-]{7,15}$/, "Invalid phone number")
    .notRequired(),

  companyWebsite: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .url("Invalid website URL")
    .notRequired(),
});
