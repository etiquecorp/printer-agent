import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/shared/types/agent";

const statusConfig: Record<
  AgentStatus,
  { label: string; dot: string; variant: "outline" | "default" | "destructive" }
> = {
  idle: {
    label: "Não verificado",
    dot: "bg-muted-foreground",
    variant: "outline",
  },
  connecting: {
    label: "Conectando...",
    dot: "bg-muted-foreground animate-pulse",
    variant: "outline",
  },
  connected: { label: "Conectado", dot: "bg-chart-2", variant: "outline" },
  unauthorized: {
    label: "Não autorizado",
    dot: "bg-destructive",
    variant: "destructive",
  },
  error: {
    label: "Indisponível",
    dot: "bg-destructive",
    variant: "destructive",
  },
};

export function StatusBadge({ status }: { status: AgentStatus }) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.label}
    </Badge>
  );
}
