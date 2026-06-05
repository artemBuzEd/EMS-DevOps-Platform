import { VenuesExplorer } from "@/components/venues/VenuesExplorer";

// Public venue explorer: a searchable list of every venue beside a single map
// with all their markers. Anonymous-browsable (the venue endpoints allow it),
// linked from the Navbar for everyone.
export default function VenuesPage() {
  return <VenuesExplorer />;
}
