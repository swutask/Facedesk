export const EnterpriseBookingConfirmation = ({
  booking,
  platform_fee,
  provider_gross,
}: {
  booking: {
    candidateName: string;
    date: string;
    time: string;
    durationHours: number;
    totalAmount: number;
  };
  platform_fee: number;
  provider_gross: number;
}) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 40px; color: #111827;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #000000;">Booking Confirmed 🎉</h1>
        <p style="margin: 8px 0 0 0; font-size: 16px;">Your interview room has been successfully booked!</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px 24px; line-height: 1.6; color: #374151;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tbody>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; width: 150px;">Candidate</td>
              <td>${booking.candidateName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Date</td>
              <td>${booking.date}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Time</td>
              <td>${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Duration</td>
              <td>${booking.durationHours} hrs</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Gross Fees</td>
              <td style="color: #16a34a; font-weight: 600; font-size: 15px;">₹${provider_gross}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Platform Fees</td>
              <td style="color: #f59e0b; font-weight: 600; font-size: 15px;">₹${platform_fee}</td>
            </tr>
          </tbody>
        </table>

        <p style="font-size: 14px;">
          You can manage this booking and view invoices anytime from your
          <a href="https://facedesk-ourappdemo.vercel.app/enterprise" style="color: #2563eb; text-decoration: none; margin-left: 4px;">Enterprise Dashboard</a>.
        </p>

        <p style="font-size: 14px; margin-top: 20px; color: #6b7280;">
          Please ensure the candidate arrives on time and the interview room is prepared.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
        © ${new Date().getFullYear()} FaceDesk · Secure In-Person Interviews
      </div>

    </div>
  </div>
  `;
};
