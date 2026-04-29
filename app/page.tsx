"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Hero from "./components/hero";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RegistrationProfile = {
  fullName: string;
  age: string;
  maritalStatus: string;
  heightCm: string;
  weightKg: string;
};

const initialRegistrationProfile: RegistrationProfile = {
  fullName: "",
  age: "",
  maritalStatus: "",
  heightCm: "",
  weightKg: "",
};

export default function Home() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(Boolean(supabase));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationProfile, setRegistrationProfile] = useState<RegistrationProfile>(initialRegistrationProfile);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"login" | "signup" | "logout" | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthMessage(error.message);
      }

      setSession(data.session ?? null);
      setLoadingSession(false);
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoadingSession(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) {
      setAuthMessage("Supabase environment variables are missing.");
      return;
    }

    setPendingAction("login");
    setAuthMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthMessage(error.message);
    }

    setPendingAction(null);
  };

  const handleSignUp = async () => {
  if (!supabase) {
    setAuthMessage("Supabase environment variables are missing.");
    return;
  }

  // ...validation code...

  setPendingAction("signup");
  setAuthMessage(null);

  // 1. Register user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: registrationProfile.fullName.trim(),
        age: registrationProfile.age,
        marital_status: registrationProfile.maritalStatus,
        height_cm: registrationProfile.heightCm,
        weight_kg: registrationProfile.weightKg,
      },
    },
  });

  if (error) {
    setAuthMessage(error.message);
    setPendingAction(null);
    return;
  }

  // 2. Sign in the user (if not already signed in)
  let userId = data.user?.id;
  if (!userId) {
    // Try to sign in (for email confirmation flows, this may not work until confirmed)
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setAuthMessage("Registered, but failed to log in for profile creation: " + loginError.message);
      setPendingAction(null);
      return;
    }
    userId = loginData.user?.id;
  }

  if (userId) {
    const { error: profileError } = await supabase.from("patient_profiles").insert([
      {
        user_id: userId,
        full_name: registrationProfile.fullName.trim(),
        age: registrationProfile.age,
        marital_status: registrationProfile.maritalStatus,
        height_cm: registrationProfile.heightCm,
        weight_kg: registrationProfile.weightKg,
      },
    ]);
    if (profileError) {
      setAuthMessage("Registered, but failed to save profile: " + profileError.message);
      setPendingAction(null);
      return;
    }
  }

  setAuthMessage("Registration successful. Confirm your email if your project requires verification.");
  setRegistrationProfile(initialRegistrationProfile);
  setPendingAction(null);
};
  const handleLogout = async () => {
    if (!supabase) {
      return;
    }

    setPendingAction("logout");
    await supabase.auth.signOut();
    setPendingAction(null);
  };

  return (
    <div className="flex flex-col flex-1 p-4 text-3xl bg-zinc-50 font-sans dark:bg-black text-center">
      <h1 className="mx-auto mb-4 w-fit">Doctor Agenda</h1>

      <div className="mx-auto w-full max-w-xl text-base">
        {!supabase ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-left text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable login.
          </div>
        ) : null}

        {loadingSession ? (
          <p className="text-center text-zinc-600 dark:text-zinc-300">Checking session...</p>
        ) : null}

        {!loadingSession && !session && supabase ? (
          <form
            onSubmit={handleLogin}
            className="space-y-3 rounded-xl border border-zinc-300 bg-white p-5 text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Register or Login</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Please sign in first to access all appointment options.
            </p>

            <input
              type="email"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />

            <input
              type="password"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              minLength={6}
              required
            />

            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
              <p className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Registration details (required for Register)</p>

              <input
                type="text"
                className="mb-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                value={registrationProfile.fullName}
                onChange={(e) =>
                  setRegistrationProfile((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Full name"
                required
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  min={1}
                  max={120}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  value={registrationProfile.age}
                  onChange={(e) =>
                    setRegistrationProfile((prev) => ({ ...prev, age: e.target.value }))
                  }
                  placeholder="Age"
                  required
                />

                <select
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  value={registrationProfile.maritalStatus}
                  onChange={(e) =>
                    setRegistrationProfile((prev) => ({ ...prev, maritalStatus: e.target.value }))
                  }
                  required
                >
                  <option value="">Marital status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="number"
                  min={40}
                  max={260}
                  step="0.1"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  value={registrationProfile.heightCm}
                  onChange={(e) =>
                    setRegistrationProfile((prev) => ({ ...prev, heightCm: e.target.value }))
                  }
                  placeholder="Height (cm)"
                  required
                />

                <input
                  type="number"
                  min={2}
                  max={400}
                  step="0.1"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  value={registrationProfile.weightKg}
                  onChange={(e) =>
                    setRegistrationProfile((prev) => ({ ...prev, weightKg: e.target.value }))
                  }
                  placeholder="Weight (kg)"
                  required
                />
              </div>
            </div>

            {authMessage ? <p className="text-sm text-red-600 dark:text-red-400">{authMessage}</p> : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSignUp}
                disabled={pendingAction !== null}
                className="rounded-md border border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {pendingAction === "signup" ? "Registering..." : "Register"}
              </button>
              <button
                type="submit"
                disabled={pendingAction !== null}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {pendingAction === "login" ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        ) : null}

        {!loadingSession && session ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-zinc-300 bg-white p-4 text-left dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                Logged in as <span className="font-semibold">{session.user.email}</span>
              </p>
              <button
                type="button"
                onClick={handleLogout}
                disabled={pendingAction !== null}
                className="rounded-md border border-zinc-400 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {pendingAction === "logout" ? "Signing out..." : "Logout"}
              </button>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <Hero />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
