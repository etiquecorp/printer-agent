import { useEffect, useState } from "react";
import {
  IconBuildingStore,
  IconClipboard,
  IconDownload,
  IconExternalLink,
  IconHelpCircle,
  IconLogout,
  IconPrinter,
  IconRefresh,
  IconServer2,
  IconSettings,
  IconTerminal2,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/logo";

import { agentBridge } from "@/shared/services/agent-bridge";
import { useAgentRuntime } from "@/shared/stores/agent-runtime";
import { useAuth } from "@/shared/stores/auth";
import { useDevice } from "@/shared/stores/device";
import { useLogs } from "@/shared/stores/logs";
import { useSettings } from "@/shared/stores/settings";
import { StatusBadge } from "../components/status-badge";

const LOG_LEVEL_CLASS: Record<string, string> = {
  info: "text-muted-foreground",
  warn: "text-chart-4",
  error: "text-destructive",
};

export function DashboardPage() {
  const logout = useAuth((state) => state.logout);
  const currentTenantId = useAuth((state) => state.currentTenantId);
  const session = useAuth((state) => state.session);
  const { locationName, clearLocation } = useDevice();
  const browserPrintUrl = useSettings((state) => state.browserPrintUrl);
  const setBrowserPrintUrl = useSettings((state) => state.setBrowserPrintUrl);

  const status = useAgentRuntime((state) => state.status);
  const printers = useAgentRuntime((state) => state.printers);
  const logs = useLogs((state) => state.entries);
  const clearLogsLocal = useLogs((state) => state.clear);

  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loginItemEnabled, setLoginItemEnabled] = useState(false);
  const [testingUid, setTestingUid] = useState<string | null>(null);
  const [installing, setInstalling] = useState<
    "browser-print" | "driver" | null
  >(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const companyName = currentTenantId
    ? session?.tenants[currentTenantId]
    : undefined;
  const isUnauthorized = status === "unauthorized";
  const canReconnect =
    (status === "error" || status === "idle") && !isUnauthorized;
  const hasPrinters = printers.length > 0;
  const hasLogs = logs.length > 0;

  useEffect(() => {
    agentBridge.getLoginItemEnabled().then(setLoginItemEnabled);
  }, []);

  async function refreshPrinters() {
    setRefreshing(true);
    try {
      await agentBridge.refreshPrinters();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleReconnect() {
    await agentBridge.reconnect();
  }

  async function handleTestPrint(uid: string, name: string) {
    setTestingUid(uid);
    try {
      await agentBridge.testPrint(uid);
      toast.success(`Impressão de teste enviada para "${name}".`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao enviar teste.",
      );
    } finally {
      setTestingUid(null);
    }
  }

  async function handleCopyLogs() {
    const text = logs
      .map(
        (entry) =>
          `[${new Date(entry.timestamp).toLocaleString("pt-BR")}] ${entry.level.toUpperCase()}: ${entry.message}`,
      )
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Logs copiados.");
  }

  async function handleClearLogs() {
    await agentBridge.clearLogs();
    clearLogsLocal();
  }

  async function handleTrocarLocal() {
    await agentBridge.clearDevice();
    clearLocation();
  }

  async function handleSair() {
    await agentBridge.clearDevice();
    logout();
  }

  async function handleInstallBrowserPrint() {
    setInstalling("browser-print");
    try {
      await agentBridge.runBrowserPrintInstaller();
    } catch (error) {
      console.error(error);
      toast.error(
        "Não foi possível abrir o instalador do Zebra Browser Print.",
      );
    } finally {
      setInstalling(null);
    }
  }

  async function handleInstallDriver() {
    setInstalling("driver");
    try {
      await agentBridge.runDriverInstaller();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível abrir o instalador do driver.");
    } finally {
      setInstalling(null);
    }
  }

  async function handleLoginItemChange(checked: boolean) {
    setLoginItemEnabled(checked);
    await agentBridge.setLoginItemEnabled(checked);
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border bg-primary px-5 py-3">
        <div className="flex items-center gap-3">
          <Logo mark="icon" variant="white" className="h-7" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-primary-foreground">
              {companyName ?? "Etique"}
            </span>
            <span className="flex items-center gap-1 text-xs text-primary-foreground/75">
              <IconBuildingStore className="size-3.5" />
              {locationName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground"
            title="Primeira vez neste computador?"
            onClick={() => setShowInstallHelp(true)}
          >
            <IconHelpCircle className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={handleTrocarLocal}
          >
            Trocar local
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={handleSair}
          >
            <IconLogout className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconServer2 className="size-4 text-muted-foreground" />
                Etique
              </CardTitle>
              <CardDescription>
                Envio de etiquetas em tempo real
              </CardDescription>
              <CardAction>
                <StatusBadge status={status} />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {isUnauthorized && (
                <p className="text-sm text-muted-foreground">
                  Este computador não está mais autorizado. Troque o local pra
                  parear de novo.
                </p>
              )}

              {canReconnect && (
                <Button size="sm" variant="outline" onClick={handleReconnect}>
                  <IconRefresh className="size-4" />
                  Reconectar agora
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPrinter className="size-4 text-muted-foreground" />
                Impressão
              </CardTitle>
              <CardDescription>Comunicação com as impressoras</CardDescription>
              <CardAction>
                <StatusBadge status={hasPrinters ? "connected" : "idle"} />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasPrinters && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refreshPrinters}
                    disabled={refreshing}
                  >
                    <IconRefresh
                      className={refreshing ? "size-4 animate-spin" : "size-4"}
                    />
                    Verificar agora
                  </Button>

                  {!refreshing && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma impressora encontrada em {browserPrintUrl}.
                      Confirme que o serviço está instalado e em execução.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={showInstallHelp} onOpenChange={setShowInstallHelp}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Primeira vez neste computador?</DialogTitle>
              <DialogDescription>
                Instale o serviço de impressão e o driver da impressora Zebra
                antes de verificar novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-4">
              <Button
                variant="outline"
                className="justify-start"
                disabled={installing !== null}
                onClick={handleInstallBrowserPrint}
              >
                <IconDownload className="size-4" />
                {installing === "browser-print"
                  ? "Abrindo..."
                  : "Instalar Zebra Browser Print"}
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                disabled={installing !== null}
                onClick={handleInstallDriver}
              >
                <IconDownload className="size-4" />
                {installing === "driver"
                  ? "Abrindo..."
                  : "Instalar driver da impressora"}
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Se os botões acima não funcionarem, baixe direto do site da
                Zebra:
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <a
                  href="https://www.zebra.com/br/pt/forms/browser-print-request-pc.html"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground hover:underline"
                >
                  <IconExternalLink className="size-3.5" />
                  Zebra Browser Print
                </a>
                <a
                  href="https://www.zebra.com/br/pt/support-downloads/printers/printer-drivers.html"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground hover:underline"
                >
                  <IconExternalLink className="size-3.5" />
                  Driver da impressora
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Impressoras detectadas</CardTitle>
            <CardDescription>
              Impressoras disponíveis neste computador
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasPrinters ? (
              <Empty className="p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconPrinter />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma impressora encontrada</EmptyTitle>
                  <EmptyDescription>
                    Clique em &quot;Verificar agora&quot; para procurar
                    impressoras.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {printers.map((printer) => (
                  <div
                    key={printer.uid}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {printer.name}
                        </span>
                        <Badge variant="outline">Pronta</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {printer.connection}
                      </span>
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={testingUid === printer.uid}
                      onClick={() => handleTestPrint(printer.uid, printer.name)}
                    >
                      {testingUid === printer.uid ? "Testando..." : "Testar"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle
              className="flex cursor-pointer items-center gap-2"
              onClick={() => setShowSettings((v) => !v)}
            >
              <IconSettings className="size-4 text-muted-foreground" />
              Configurações
            </CardTitle>
          </CardHeader>
          {showSettings && (
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="browser-print-url">
                  Endereço do serviço de impressão
                </FieldLabel>
                <Input
                  id="browser-print-url"
                  defaultValue={browserPrintUrl}
                  onBlur={(e) => {
                    setBrowserPrintUrl(e.target.value);
                    void agentBridge.updateSettings({
                      browserPrintUrl: e.target.value,
                    });
                  }}
                />
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  id="login-item"
                  checked={loginItemEnabled}
                  onCheckedChange={(checked) =>
                    handleLoginItemChange(checked === true)
                  }
                />
                <FieldLabel htmlFor="login-item" className="font-normal">
                  Iniciar automaticamente com o computador
                </FieldLabel>
              </Field>

              <Separator />
              <p className="text-xs text-muted-foreground">
                Versão do agente 1.0.0
              </p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle
              className="flex cursor-pointer items-center gap-2"
              onClick={() => setShowLogs((v) => !v)}
            >
              <IconTerminal2 className="size-4 text-muted-foreground" />
              Logs
            </CardTitle>
          </CardHeader>

          {showLogs && (
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopyLogs}>
                  <IconClipboard className="size-4" />
                  Copiar
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearLogs}>
                  <IconTrash className="size-4" />
                  Limpar
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                {!hasLogs ? (
                  <Empty className="p-4">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <IconTerminal2 />
                      </EmptyMedia>
                      <EmptyTitle>Nenhum evento registrado</EmptyTitle>
                      <EmptyDescription>
                        Os eventos do agente vão aparecer aqui conforme
                        acontecem.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-1 font-mono text-xs">
                    {logs.map((entry, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="shrink-0 text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString(
                            "pt-BR",
                          )}
                        </span>
                        <span className={LOG_LEVEL_CLASS[entry.level] ?? ""}>
                          {entry.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}
