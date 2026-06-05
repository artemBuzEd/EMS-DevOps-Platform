import { EventsCatalog } from "@/components/home/EventsCatalog";

// Canonical URL for the events catalog. Public — browseable signed-in or out;
// the Navbar's "Events" item points here, and it's where signed-in users land
// when they want to browse (their `/` is the dashboard).
export default function EventsPage() {
  return <EventsCatalog />;
}
