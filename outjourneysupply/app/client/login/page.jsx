"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { getSupabaseClient } from "../../../lib/supabase/client";

const captchaSiteKey = process.env.NEXT_PUBLIC_SUPABASE_CAPTCHA_SITE_KEY;

export default function ClientLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setErrorMessage("");
    setCaptchaToken("");
    setCaptchaResetKey((key) => key + 1);
  };

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="client-login-title">
        <Link className="login-brand" href="/" aria-label="Outjourney home">
          <Image src="/img/outjourney-logo-wide.png" alt="Outjourney" width={220} height={62} priority />
        </Link>
        <div className="login-eyebrow">CLIENT PORTAL</div>
        <h1 id="client-login-title">{mode === "login" ? "Client sign in" : "Create account"}</h1>
        <p className="login-description">{mode === "login" ? "Orders, invoices, delivery tracking." : "Register for Outjourney client access."}</p>

        <div className="login-mode-switch" aria-label="Client account mode">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Sign in</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Register</button>
        </div>

        <form className="login-form" onSubmit={async (event) => {
          event.preventDefault();
          setErrorMessage("");
          setLoading(true);
          try {
            if (mode === "register" && !captchaSiteKey) {
              setErrorMessage("Registration is unavailable until bot protection is configured.");
              return;
            }
            if (captchaSiteKey && !captchaToken) {
              setErrorMessage("Complete the security check before continuing.");
              return;
            }

            const supabase = getSupabaseClient();
            if (mode === "register") {
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: { full_name: name },
                  emailRedirectTo: `${window.location.origin}/client`,
                  captchaToken: captchaToken || undefined,
                },
              });
              if (error) {
                setErrorMessage(error.message);
                return;
              }
              if (data.session) {
                router.replace("/client");
                router.refresh();
              } else {
                setErrorMessage("Account created. Check your email to confirm your account before signing in.");
              }
            } else {
              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
                options: { captchaToken: captchaToken || undefined },
              });
              if (error) {
                setErrorMessage("Email or password is incorrect.");
                return;
              }
              const adminEmail = process.env.NEXT_PUBLIC_ADMIN_LOGIN_EMAIL;
              const isAdmin = Boolean(
                adminEmail &&
                  data.user?.email &&
                  data.user.email.toLowerCase() === adminEmail.toLowerCase(),
              );
              router.replace(isAdmin ? "/workspace" : "/client");
              router.refresh();
            }
          } catch (error) {
            console.error("Outjourney client sign-in failed.", error);
            setErrorMessage("Sign-in is temporarily unavailable.");
          } finally {
            setLoading(false);
            setCaptchaToken("");
            setCaptchaResetKey((key) => key + 1);
          }
        }}>
          {mode === "register" && (
            <div className="login-field">
              <label htmlFor="client-name">Business name</label>
              <input id="client-name" type="text" autoComplete="organization" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
          )}
          <div className="login-field">
            <label htmlFor="client-email">Email</label>
            <input id="client-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="login-field">
            <label htmlFor="client-password">Password</label>
            <div className="login-password-wrap">
              <input id="client-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button className="login-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {captchaSiteKey ? (
            <div className="login-captcha">
              <Turnstile
                key={captchaResetKey}
                siteKey={captchaSiteKey}
                onSuccess={setCaptchaToken}
                onExpire={() => setCaptchaToken("")}
                onError={() => {
                  setCaptchaToken("");
                  setErrorMessage("Security verification could not load. Please try again.");
                }}
              />
            </div>
          ) : mode === "register" ? (
            <p className="login-captcha-note" role="status">
              Registration will be available after bot protection is configured.
            </p>
          ) : null}
          {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}
          <button
            className="login-submit"
            type="submit"
            disabled={loading || (mode === "register" && !captchaSiteKey) || (Boolean(captchaSiteKey) && !captchaToken)}
          >
            {loading ? "Signing in..." : "Open client portal"}{!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <div className="login-security-note"><LockKeyhole size={15} /><span>Secure client access</span></div>
        <Link className="login-home-link" href="/login"><ArrowLeft size={13} /> Admin login</Link>
      </section>
    </main>
  );
}
