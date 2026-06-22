import { useState } from "react";
import { ArrowRight, Loader2, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { CaaryaLogo } from "@/components/layout/CaaryaLogo";
import { cn } from "@/lib/utils";

export default function Login() {
  const {
    isFirebaseEnabled,
    status,
    otpStepVisible,
    isSendingOtp,
    isVerifyingOtp,
    sendOtp,
    verifyOtp,
    loginDemo,
    resetOtp,
  } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const statusTone =
    status.type === "error"
      ? "text-bad"
      : status.type === "success"
        ? "text-good"
        : "text-ink-muted";

  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <CaaryaLogo className="h-9" />
            <h1 className="mt-5 font-display text-2xl font-black text-ink">Pod Operating Portal</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Sign in to your pod's research, outreach & talent workspace.
            </p>
          </div>

          {!otpStepVisible ? (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Phone number</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                    +91
                  </span>
                  <Input
                    inputMode="numeric"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="pl-12"
                  />
                </div>
              </label>
              <Button
                className="w-full"
                size="lg"
                disabled={isSendingOtp}
                onClick={() => sendOtp(phone)}
              >
                {isSendingOtp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Send verification code
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Verification code</span>
                <Input
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-[0.4em]"
                />
              </label>
              <Button
                className="w-full"
                size="lg"
                disabled={isVerifyingOtp}
                onClick={() => verifyOtp(otp, phone)}
              >
                {isVerifyingOtp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Verify & sign in
              </Button>
              <button
                onClick={() => {
                  setOtp("");
                  resetOtp();
                }}
                className="w-full text-center text-xs text-ink-faint hover:text-ink-muted"
              >
                Use a different number
              </button>
            </div>
          )}

          {status.message && (
            <p className={cn("mt-3 text-center text-xs", statusTone)}>{status.message}</p>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[10px] uppercase tracking-widest text-ink-faint">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <Button variant="outline" className="w-full" onClick={loginDemo}>
            Continue in demo mode <ArrowRight className="h-4 w-4" />
          </Button>

          {!isFirebaseEnabled && (
            <p className="mt-3 text-center text-[11px] text-ink-faint">
              Firebase phone sign-in is not configured. Set the <code>VITE_FIREBASE_*</code> keys to
              enable OTP login, or explore the portal in demo mode.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-ink-faint">
          Caarya · Pod Operating Portal v6
        </p>
      </div>

      <div id="firebaseRecaptchaHost" />
    </div>
  );
}
