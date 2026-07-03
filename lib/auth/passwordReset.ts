import { axiosInstance } from "@/lib/axiosInstance";

/** Matches backend OTP purposes (same pattern as email verification). */
export const PASSWORD_RESET_OTP_PURPOSE = "password_reset" as const;

/**
 * Request a password-reset code by email.
 * Backend: POST auth/send-otp { email, purpose: "password_reset" }
 */
export async function requestPasswordResetCode(email: string): Promise<void> {
  await axiosInstance.post("auth/send-otp", {
    email: email.trim().toLowerCase(),
    purpose: PASSWORD_RESET_OTP_PURPOSE,
  });
}

/**
 * Set a new password using the emailed code.
 * Backend: POST auth/reset-password { email, otp, password }
 */
export async function resetPasswordWithOtp(params: {
  email: string;
  otp: string;
  password: string;
}): Promise<void> {
  await axiosInstance.post("auth/reset-password", {
    email: params.email.trim().toLowerCase(),
    otp: params.otp.trim(),
    password: params.password,
  });
}

export function passwordResetErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response
    ?.data?.message;
  return message?.trim() || fallback;
}
