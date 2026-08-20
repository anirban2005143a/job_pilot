"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { clearUser, store } from "@/lib/store";
import "react-toastify/dist/ReactToastify.css";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const logout = () => { store.dispatch(clearUser()); router.replace("/"); };
    window.addEventListener("jobpilot:logout", logout);
    return () => window.removeEventListener("jobpilot:logout", logout);
  }, [router]);
  return <Provider store={store}>{children}<ToastContainer position="bottom-right" theme="light" /></Provider>;
}
