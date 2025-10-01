export const CandidateConfirmation = ({
  fullName,
  roomName,
  date,
  time,
  custom_note,
}: {
  fullName: string;
  roomName: string;
  date: string;
  time: string;
  custom_note?: string;
}) => {
  return `
<div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #111827;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; color: #000000;">Interview Confirmed ✅</h1>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin-bottom: 16px;">Hello <b>${fullName}</b>,</p>
      <p style="font-size: 15px; margin-bottom: 16px;">Your in-person interview has been scheduled. Please find the details below:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tbody>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 120px;">Room</td>
            <td>${roomName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Date</td>
            <td>${date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Time</td>
            <td>${time}</td>
          </tr>
        </tbody>
      </table>

      ${custom_note ? `
        <p style="font-size: 14px; margin-top: 16px; line-height: 1.5; color: #374151;">
          <b>Note:</b> ${custom_note}
        </p>
      ` : ''}

      <p style="font-size: 14px; color: #374151; margin-top: 16px; line-height: 1.5;">
        Please arrive 10–15 minutes early and bring a valid government ID for verification.  
        If you have any special requests, ensure they are communicated to the recruiter beforehand.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 13px; color: #6b7280;">
      © ${new Date().getFullYear()} FaceDesk · Secure In-Person Interviews
    </div>

  </div>
</div>

  `;
};
