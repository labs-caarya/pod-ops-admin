import { useState } from "react";
import { Loader2, LockKeyhole, User2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { CaaryaLogo } from "@/components/layout/CaaryaLogo";
import { cn } from "@/lib/utils";

export default function Login() {
  const { status, isSigningIn, loginWithCredentials, clearStatus } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const statusTone =
    status.type === "error"
      ? "text-bad"
      : status.type === "success"
        ? "text-good"
        : "text-ink-muted";

  return (
    <div className="relative flex min-h-dvh min-h-[100dvh] items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <div className={cn("p-6 sm:p-8", "card-glass", "md:card md:shadow-none")}>
          <div className="mb-6 flex flex-col items-center text-center">
            <CaaryaLogo className="h-9" />
            <h1 className="mt-5 font-display text-2xl font-black text-ink">Pod Ops Admin</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Sign in with the admin account to manage pod ops access and the control-room demo.
            </p>
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void loginWithCredentials(username, password);
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Username</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                  <User2 className="h-4 w-4" />
                </span>
                <Input
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    clearStatus();
                    setUsername(e.target.value);
                  }}
                  className="border-line/70 bg-base/50 pl-10 backdrop-blur-sm"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Password</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    clearStatus();
                    setPassword(e.target.value);
                  }}
                  className="border-line/70 bg-base/50 pl-10 backdrop-blur-sm"
                />
              </div>
            </label>

            <Button className="w-full" size="lg" disabled={isSigningIn} type="submit">
              {isSigningIn ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}
              Sign in
            </Button>
          </form>

          {status.message && (
            <p className={cn("mt-3 text-center text-xs", statusTone)}>{status.message}</p>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-ink-faint/90 drop-shadow-sm">
          Caarya · Admin dashboard demo
        </p>
      </div>
    </div>
  );
}
