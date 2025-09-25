import * as yup from "yup";

const bookingSchema = yup.object().shape({
  candidateName: yup
    .string()
    .required("Full Name is required"),

  candidateEmail: yup
    .string()
    .required("Email Address is required")
    .email("Invalid email address"),

  idType: yup
    .string()
    .required("Government ID Type is required"),
  

  idNumber: yup
    .string()
    .required("Government ID Number is required"),


  date: yup
    .string()
    .required("Date is required"),


  time: yup
    .string()
    .required("Start Time is required"),
    

  duration: yup
    .string()
    .required("Duration is required")
    .oneOf(["1", "2", "3", "4"], "Invalid duration"),

  termsAccepted: yup
    .boolean()
    .oneOf([true], "You must accept the terms to continue"),
});

export default bookingSchema;
