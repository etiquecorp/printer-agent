import { useEffect } from "react";

import { agentBridge } from "@/shared/services/agent-bridge";
import { useAgentRuntime } from "@/shared/stores/agent-runtime";
import type { AgentStatus } from "@/shared/types/agent";

export function useAgentRuntimeSync(): void {
  const setStatus = useAgentRuntime((state) => state.setStatus);
  const setPrinters = useAgentRuntime((state) => state.setPrinters);

  useEffect(() => {
    agentBridge.getStatus().then(({ status, printers }) => {
      setStatus(status as AgentStatus);
      setPrinters(printers);
    });

    const unsubscribeStatus = agentBridge.onStatus((status) =>
      setStatus(status as AgentStatus),
    );
    const unsubscribePrinters = agentBridge.onPrinters(setPrinters);

    return () => {
      unsubscribeStatus();
      unsubscribePrinters();
    };
  }, [setStatus, setPrinters]);
}
