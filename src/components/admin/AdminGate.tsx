"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { adminMe, fetchServices, type Service } from "@/lib/client/api";
import { practiceTodayISO } from "@/lib/practice-config";

/**
 * Client-side gate for /admin: checks the session, loads the service menu,
 * and hands off to the dashboard. (The admin API re-checks auth on every
 * request server-side — this gate is UX, not the security boundary.)
 */
export default function AdminGate() {
  const router = useRouter();
  const [state, setState] = useState<
    | { phase: "checking" }
    | { phase: "ready"; services: Service[]; today: string }
  >({ phase: "checking" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await adminMe();
      if (cancelled) return;
      if (!me.authed) {
        router.replace("/admin/login");
        return;
      }
      const res = await fetchServices();
      if (cancelled) return;
      const services =
        "services" in res ? (res as { services: Service[] }).services : [];
      setState({ phase: "ready", services, today: practiceTodayISO() });
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state.phase === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-sm text-muted">Opening the appointment book…</div>
      </div>
    );
  }

  return <AdminDashboard services={state.services} today={state.today} />;
}
