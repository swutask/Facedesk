export const EnterpriseBookingConfirmation = ({
  booking,
  platform_fee,
  roomName,
}: {
  booking: {
    candidateName: string;
    date: string;
    time: string;
    durationHours: number;
    totalAmount: number;
  };
  platform_fee: number;
  roomName: string;
}) => {
  const formattedDateTime = `${booking.date} ${booking.time}`;

  return `
  <div style="font-family: Arial, sans-serif; line-height:1.5; color: #111827;">
    <p>Hi,</p>

    <p>This is to confirm that the candidate has successfully booked the interview room.</p>

    <p><b>Room Name:</b> ${roomName}</p>
    <p><b>Candidate Name:</b> ${booking.candidateName}</p>
    <p><b>Date & Time:</b> ${formattedDateTime}</p>
    <p><b>Duration:</b> ${booking.durationHours} hrs</p>
    <p><b>Platform Fees:</b> ₹${platform_fee}</p>

    <p>Please ensure the interview room is prepared and ready for the candidate.</p>

    <p>Best regards,<br/>FaceDesk Team</p>
  </div>
  `;
};
