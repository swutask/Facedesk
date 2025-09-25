import * as yup from "yup";

export const roomSchema = yup
  .object({
    roomName: yup.string().required("Room name is required"),
    spaceName: yup.string().required("Space name is required"),
    pricing: yup.object({
      hourlyRate: yup.string().required("Hourly rate is required"),
    }),
    availability: yup.object({
      workingDays: yup
        .object({
          monday: yup.boolean(),
          tuesday: yup.boolean(),
          wednesday: yup.boolean(),
          thursday: yup.boolean(),
          friday: yup.boolean(),
          saturday: yup.boolean(),
          sunday: yup.boolean(),
        })
        .test(
          "at-least-one-day",
          "At least one working day must be selected",
          function (value) {
            if (!value) return false;
            return Object.values(value).some((daySelected) => daySelected === true);
          }
        ),
      timeRange: yup.object({
        start: yup
          .string()
          .required("Start time is required")
          .test(
            "is-before-end",
            "Start time cannot be later than end time",
            function (value) {
              const { end } = this.parent;
              if (!value || !end) return true;
              const [startH, startM] = value.split(":").map(Number);
              const [endH, endM] = end.split(":").map(Number);
              return startH * 60 + startM <= endH * 60 + endM;
            }
          ),
        end: yup
          .string()
          .required("End time is required")
          .test(
            "is-after-start",
            "End time cannot be earlier than start time",
            function (value) {
              const { start } = this.parent;
              if (!value || !start) return true;
              const [startH, startM] = start.split(":").map(Number);
              const [endH, endM] = value.split(":").map(Number);
              return endH * 60 + endM >= startH * 60 + startM;
            }
          ),
      }),
    }),
  })
  .test("full-address", function () {
    const { placeMeta, location } = (this as any).options?.context || {};
    const hasLatLng =
      !!location && typeof location.lat === "number" && typeof location.lng === "number";
    const hasAddressTextOrId = !!placeMeta?.formatted_address || !!placeMeta?.place_id;

    return hasLatLng && hasAddressTextOrId
      ? true
      : this.createError({ path: "formatted_address", message: "Full address is required" });
  });
