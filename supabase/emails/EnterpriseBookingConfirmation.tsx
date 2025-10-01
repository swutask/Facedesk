export const EnterpriseBookingConfirmation = ({
  booking,
  total_fees,
  roomName,
  firstName,
}: {
  booking: {
    candidateName: string;
    date: string;
    time: string;
  };
  total_fees: number;
  roomName: string;
  firstName?: string;
}) => {
  const formattedDateTime = `${booking.date} ${booking.time}`;

  return `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #111827;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; color: #000000;">Booking Confirmed ✅</h1>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px; margin-bottom: 16px;">Hi ${firstName ?? ""},</p>
        <p style="font-size: 16px; margin-bottom: 16px;">This is to confirm that the candidate has successfully booked the interview room.</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tbody>
            <tr><td style="padding: 8px 0; font-weight: bold; width: 150px;">Room Name</td><td>${roomName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Candidate Name</td><td>${booking.candidateName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Date & Time</td><td>${formattedDateTime}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Total Fees</td><td>₹${total_fees}</td></tr>
          </tbody>
        </table>
        
      </div>
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 13px; color: #6b7280;">
        © ${new Date().getFullYear()} FaceDesk · Secure In-Person Interviews
      </div>
    </div>
  </div>
  `;
};
