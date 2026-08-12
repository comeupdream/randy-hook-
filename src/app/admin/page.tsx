import type { Metadata } from "next";
import AdminGate from "@/components/admin/AdminGate";

export const metadata: Metadata = {
  title: "Appointment book",
  robots: { index: false, follow: false },
};

/**
 * Static shell — AdminGate verifies the session client-side (cookie-backed
 * API in production, in-browser store in the demo) and renders the dashboard.
 * Every admin API route re-checks auth server-side regardless.
 */
export default function AdminPage() {
  return <AdminGate />;
}
