

export const CandidateOTP = ({ candidateName, otp, otpExpiry }) => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #111827;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #4F46E5, #3B82F6); color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; color: #000000;">Interview Check-In OTP</h1>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; margin-bottom: 16px;">Hello <b>${candidateName}</b>,</p>
          <p style="font-size: 16px; margin-bottom: 16px;">Your one-time password (OTP) for checking into your interview is:</p>
          <h2 style="font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; margin-bottom: 24px;">${otp}</h2>
          <p style="font-size: 14px; color: #6b7280;">Please provide this OTP to the space provider at the interview location. This OTP will expire on <b>${otpExpiry}</b>.</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 13px; color: #6b7280;">
          © ${new Date().getFullYear()} FaceDesk · Secure In-Person Interviews
        </div>
      </div>
    </div>
  `;
};
