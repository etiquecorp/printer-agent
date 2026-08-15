import { useEffect } from "react";

import { agentBridge } from "@/shared/services/agent-bridge";
import { useLogs } from "@/shared/stores/logs";

export function useLogsSync(): void {
  const setEntries = useLogs((state) => state.setEntries);
  const appendEntry = useLogs((state) => state.appendEntry);

  useEffect(() => {
    agentBridge.getLogs().then(setEntries);

    return agentBridge.onLogAppend(appendEntry);
  }, [setEntries, appendEntry]);
}
