"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { getSupabaseClient } from "../../../lib/supabase/client";

export default function ClientLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setErrorMessage(""); }}>Sign in</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setErrorMessage(""); }}>Register</button>
        </div>

        <form className="login-form" onSubmit={async (event) => {
          event.preventDefault();
          setErrorMessage("");
          setLoading(true);
          try {
            const supabase = getSupabaseClient();
            if (mode === "register") {
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: { full_name: name },
                  emailRedirectTo: `${window.location.origin}/client`,
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
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) {
                setErrorMessage("Email or password is incorrect.");
                return;
              }
              router.replace("/client");
              router.refresh();
            }
          } catch (error) {
            console.error("Outjourney client sign-in failed.", error);
            setErrorMessage("Sign-in is temporarily unavailable.");
          } finally {
            setLoading(false);
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
          {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}
          <button className="login-submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Open client portal"}{!loading && <ArrowRight size={17} />}</button>
        </form>

        <div className="login-security-note"><LockKeyhole size={15} /><span>Secure client access</span></div>
        <Link className="login-home-link" href="/login"><ArrowLeft size={13} /> Admin login</Link>
      </section>
    </main>
  );
}
