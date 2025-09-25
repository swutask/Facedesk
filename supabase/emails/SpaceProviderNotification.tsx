export const SpaceProviderNotification = ({
  candidateName,
  room,
}: {
  candidateName: string;
  room: { room_name: string };
}) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #111827;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; color: #000000; ">New Booking Received 📩</h1>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px; margin-bottom: 16px;">A new candidate has booked an interview at your space.</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tbody>
            <tr><td style="padding: 8px 0; font-weight: bold; width: 150px;">Candidate</td><td>${candidateName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Room</td><td>${room.room_name}</td></tr>
          </tbody>
        </table>
        <p style="font-size: 14px; color: #374151; margin-top: 16px; line-height: 1.5;">
          Please ensure the room is ready and available at the scheduled time. You can review and manage all bookings from your
          <a href="https://facedesk-ourappdemo.vercel.app/provider" style="color: #059669; text-decoration: none; margin-left: 4px;">Space Provider Dashboard</a>.
        </p>
      </div>
      <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 13px; color: #6b7280;">
        © ${new Date().getFullYear()} FaceDesk · Secure In-Person Interviews
      </div>
    </div>
  </div>
  `;
};
