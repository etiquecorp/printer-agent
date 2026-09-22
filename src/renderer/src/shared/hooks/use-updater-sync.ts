import { useEffect } from "react";

import { agentBridge } from "@/shared/services/agent-bridge";
import { useUpdater } from "@/shared/stores/updater";

export function useUpdaterSync(): void {
  const setState = useUpdater((state) => state.setState);

  useEffect(() => {
    agentBridge.getUpdaterStatus().then(setState);

    return agentBridge.onUpdaterStatus(setState);
  }, [setState]);
}
