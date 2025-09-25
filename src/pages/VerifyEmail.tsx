// pages/VerifyEmail.jsx
import { useUser } from '@clerk/clerk-react';

export default function VerifyEmail() {
  const { user } = useUser();

  const email = user?.primaryEmailAddress?.emailAddress;
  const verified = user?.primaryEmailAddress?.verification?.status === 'verified';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold mb-4">Verify Your Email</h2>

      {verified ? (
        <p className="text-green-600">
          ✅ Your email <strong>{email}</strong> is verified. You can now continue.
        </p>
      ) : (
        <p className="text-gray-700">
          We’ve sent a verification link to <strong>{email}</strong>.<br />
          Please check your inbox and verify to proceed.
        </p>
      )}

      <p className="text-sm mt-6 text-gray-500">
        If you didn’t receive the email, check your spam or wait a few seconds. You’ll be redirected automatically after verification.
      </p>
    </div>
  );
}
