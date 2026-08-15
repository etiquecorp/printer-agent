import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/shared/services/query-client";
import { useAgentRuntimeSync } from "@/shared/hooks/use-agent-runtime-sync";
import { useLogsSync } from "@/shared/hooks/use-logs-sync";
import { useAuth } from "@/shared/stores/auth";
import { useDevice } from "@/shared/stores/device";

import { LoginPage } from "@/features/auth/pages/login-page";
import { LocationPage } from "@/features/location/pages/location-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";

function Screens() {
  const isLoggedIn = useAuth((state) => state.isLoggedIn);
  const locationId = useDevice((state) => state.locationId);

  if (!isLoggedIn) return <LoginPage />;
  if (!locationId) return <LocationPage />;
  return <DashboardPage />;
}

function App() {
  useAgentRuntimeSync();
  useLogsSync();

  return (
    <QueryClientProvider client={queryClient}>
      <Screens />
    </QueryClientProvider>
  );
}

export default App;
