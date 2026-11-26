"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Users } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "error") {
      setErrorMessage("Google sign-in could not be completed. Check the Google provider setup and try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (!("serviceWorker" in navigator)) return;

    const reloadOnControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", reloadOnControllerChange, { once: true });
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => registration.update())
      .catch((error) => {
        console.error("Outjourney offline support could not be registered.", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", reloadOnControllerChange);
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (username.trim().toLowerCase() !== "admin") {
      setErrorMessage("Username or password is incorrect.");
      return;
    }

    const email = process.env.NEXT_PUBLIC_ADMIN_LOGIN_EMAIL;
    if (!email) {
      console.error("The admin login email is not configured.");
      setErrorMessage("Sign-in is not configured. Please contact your administrator.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage("Supabase rejected this password. Set or reset the password for the admin Auth user in Supabase.");
        return;
      }

      window.location.replace("/workspace");
    } catch (error) {
      console.error("Outjourney sign-in failed.", error);
      setErrorMessage("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setGoogleLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !publishableKey) {
        throw new Error("Supabase is not configured for Google sign-in.");
      }

      const settingsResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: publishableKey },
      });
      if (!settingsResponse.ok) {
        throw new Error(`Could not check Google provider settings (${settingsResponse.status}).`);
      }

      const settings = await settingsResponse.json();
      if (settings.external?.google !== true) {
        setErrorMessage("Google sign-in is disabled in Supabase Auth. Enable the Google provider and configure its OAuth credentials.");
        return;
      }

      const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error("Outjourney Google sign-in failed.", error);
        setErrorMessage(
          error.message.includes("provider is not enabled")
            ? "Google sign-in is disabled in Supabase Auth. Enable the Google provider and configure its OAuth credentials."
            : "Google sign-in is unavailable. Check the Google provider setup and try again.",
        );
      } else if (data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error("Supabase did not return a Google authorization URL.");
      }
    } catch (error) {
      console.error("Outjourney Google sign-in failed.", error);
      setErrorMessage("Google sign-in is temporarily unavailable. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <Link className="login-brand" href="/" aria-label="Outjourney home">
          <Image
            src="/img/outjourney-logo-wide.png"
            alt="Outjourney"
            width={220}
            height={62}
            priority
          />
        </Link>
        <div className="login-eyebrow">OUTJOURNEY WORKSPACE</div>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-description">
          Sign in to manage your orders, inventory, and deliveries.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {errorMessage && (
            <p className="login-error" role="alert">
              {errorMessage}
            </p>
          )}
          <button className="login-submit" type="submit" disabled={loading || googleLoading}>
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <div className="login-divider"><span>or continue with</span></div>
        <button
          className="login-google-button"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          <span className="login-google-mark" aria-hidden="true">G</span>
          {googleLoading ? "Connecting to Google..." : "Continue with Google"}
        </button>

        <div className="login-divider"><span>client access</span></div>
        <Link className="login-google-button login-client-button" href="/client/login">
          <Users size={17} />
          Client login
        </Link>

        <div className="login-security-note">
          <LockKeyhole size={15} />
          <span>Secure access to your Outjourney workspace</span>
        </div>
        <Link className="login-home-link" href="/">
          Return to Outjourney
        </Link>
      </section>
    </main>
  );
}
