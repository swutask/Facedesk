export const CandidateCheckInConfirmation = ({
  candidateName,
  roomName,
  interviewDate,
  interviewTime,
  confirmLink = "https://facedesk.com/confirm-interview",
}) => {
  // Format date/time
  const formattedDate = interviewDate
    ? new Date(interviewDate).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  const formattedTime = interviewTime
    ? new Date(`1970-01-01T${interviewTime}Z`).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A";

  return `
    <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #111827;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #4F46E5, #3B82F6); color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; color: #ffffff;">Check-In Confirmation</h1>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; margin-bottom: 16px;">Hello <b>${candidateName || "Candidate"}</b>,</p>
          <p style="font-size: 16px; margin-bottom: 16px;">We are pleased to inform you that your interview check-in was successful! Below are the details:</p>
          <p style="font-size: 16px; margin-bottom: 16px;"><b>Interview Room:</b> ${roomName || "N/A"}</p>
          <p style="font-size: 16px; margin-bottom: 16px;"><b>Interview Date:</b> ${formattedDate}</p>
          <p style="font-size: 16px; margin-bottom: 16px;"><b>Interview Time:</b> ${formattedTime}</p>
          <p style="font-size: 16px; margin-bottom: 16px;">Please make sure to be present in the interview room on time. We recommend arriving at least 10 minutes early.</p>

          
        </div>
        <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 13px; color: #6b7280;">
          © ${new Date().getFullYear()} FaceDesk · Secure In-Person Interviews
        </div>
      </div>
    </div>
  `;
};
