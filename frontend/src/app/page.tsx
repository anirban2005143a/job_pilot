"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { HomeView } from "@/components/HomeView";
import {
  apiFetch,
  clearSession,
  hasValidToken,
  TOKEN_EXPIRES_KEY,
} from "@/lib/api";
import { clearUser, setUser, type RootState } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.data);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadUser() {
      if (!hasValidToken()) {
        router.replace("/login");
        return;
      }
      try {
        if (!user) {
          const result = await apiFetch<{ data: RootState["user"]["data"] }>(
            "/api/dashboard/user",
          );
          if (result.data) dispatch(setUser(result.data));
        }
      } catch {
        if (active) router.replace("/login");
      } finally {
        if (active) setChecking(false);
      }
    }
    loadUser();
    const logout = () => {
      dispatch(clearUser());
      router.replace("/login");
    };
    window.addEventListener("jobpilot:logout", logout);
    return () => {
      active = false;
      window.removeEventListener("jobpilot:logout", logout);
    };
  }, [dispatch, router, user]);

  useEffect(() => {
    if (!user) return;
    const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_KEY));
    const timer = window.setTimeout(
      () => {
        clearSession();
        dispatch(clearUser());
        router.replace("/login");
      },
      Math.max(expiresAt - Date.now(), 0),
    );
    return () => window.clearTimeout(timer);
  }, [dispatch, router, user]);

  if (checking || !user)
    return (
      <main className="session-loading">
        <LoaderCircle className="animate-spin text-[#2563eb]" size={28} />
      </main>
    );
  return (
    <HomeView
      user={user}
      resumeCount={user.resumes?.length ?? 0}
      onLogout={() => {
        clearSession();
        dispatch(clearUser());
        router.replace("/login");
      }}
    />
  );
}
