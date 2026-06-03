import { redirect } from "next/navigation";

// The user dashboard moved to /dashboard and now derives the user from the
// access token (`sub`) — a user only ever sees their own dashboard, so the
// old view-anyone-by-id route just forwards there.
export default function LegacyUserDashboardRedirect() {
  redirect("/dashboard");
}
