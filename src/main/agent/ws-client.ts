import { app } from "electron";
import WebSocket from "ws";

import { browserPrintClient, type BrowserPrintDevice } from "./browser-print";
import { agentLogger } from "./logger";

export type AgentStatus =
  "idle" | "connecting" | "connected" | "unauthorized" | "error";

interface AgentMessage {
  type: string;
  payload?: unknown;
}

interface PrintJobPayload {
  requestId: string;
  browserPrintUid: string;
  zpl: string;
}

const HEARTBEAT_INTERVAL_MS = 25_000;
const PRINTERS_POLL_INTERVAL_MS = 30_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const MAX_UNAUTHORIZED_RETRIES = 3;

const TEST_ZPL = (printerName: string): string => `^XA
^PW400
^LL200
^FO20,20^A0N,28,28^FDTeste Etique^FS
^FO20,60^A0N,20,20^FD${printerName}^FS
^FO20,90^A0N,18,18^FD${new Date().toLocaleString("pt-BR")}^FS
^FO20,130^BY2^BCN,50,Y,N,N^FD123456789^FS
^XZ
`;

export interface AgentWsClientOptions {
  onStatusChange: (status: AgentStatus) => void;
  onPrintersChange: (printers: BrowserPrintDevice[]) => void;
}

export class AgentWsClient {
  private socket: WebSocket | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private printersPollTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private unauthorizedAttempts = 0;
  private manuallyDisconnected = true;
  private status: AgentStatus = "idle";
  private printers: BrowserPrintDevice[] = [];
  private lastPrinterUids = "";

  private apiUrl = "";
  private browserPrintUrl = "";
  private token = "";

  constructor(private readonly options: AgentWsClientOptions) {}

  connect(apiUrl: string, browserPrintUrl: string, token: string): void {
    this.apiUrl = apiUrl;
    this.browserPrintUrl = browserPrintUrl;
    this.token = token;
    this.manuallyDisconnected = false;
    this.unauthorizedAttempts = 0;
    this.reconnectAttempts = 0;
    this.openSocket();
  }

  disconnect(): void {
    this.manuallyDisconnected = true;
    this.clearTimers();
    this.socket?.close();
    this.socket = null;
    this.setStatus("idle");
    agentLogger.info("Desconectado manualmente.");
  }

  async refreshPrinters(): Promise<void> {
    if (!this.browserPrintUrl) return;
    await this.pollPrinters();
  }

  async testPrint(uid: string): Promise<void> {
    const device = this.printers.find((p) => p.uid === uid);
    if (!device) {
      agentLogger.error(
        `Teste de impressão: impressora ${uid} não encontrada.`,
      );
      throw new Error("Impressora não encontrada.");
    }

    agentLogger.info(
      `Enviando impressão de teste para "${device.name}" (uid=${uid}, connection=${device.connection})...`,
    );
    try {
      await browserPrintClient.printZpl(
        this.browserPrintUrl,
        device,
        TEST_ZPL(device.name),
      );
      agentLogger.info(
        `Impressão de teste enviada para "${device.name}" (uid=${uid}) com sucesso.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha desconhecida.";
      agentLogger.error(
        `Falha na impressão de teste em "${device.name}" (uid=${uid}): ${message}`,
      );
      throw error;
    }
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  getPrinters(): BrowserPrintDevice[] {
    return this.printers;
  }

  private openSocket(): void {
    this.setStatus("connecting");

    const wsUrl = this.apiUrl.replace(/^http/, "ws") + "/ws/agent";
    agentLogger.info(`Conectando a ${wsUrl} (agente v${app.getVersion()})...`);
    const socket = new WebSocket(wsUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "X-Agent-Version": app.getVersion(),
      },
    });
    this.socket = socket;

    socket.on("open", () => {
      this.reconnectAttempts = 0;
      this.unauthorizedAttempts = 0;
      this.setStatus("connected");
      agentLogger.info("Conectado ao Etique.");
      this.startHeartbeat();
      this.startPrintersPolling();
      void this.pollPrinters();
    });

    socket.on("message", (raw) => {
      void this.handleMessage(raw.toString());
    });

    socket.on("unexpected-response", (_req, res) => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        this.unauthorizedAttempts += 1;
        agentLogger.warn(
          `Handshake rejeitado: HTTP ${res.statusCode} ${res.statusMessage ?? ""} ` +
            `(tentativa ${this.unauthorizedAttempts}/${MAX_UNAUTHORIZED_RETRIES}).`,
        );
      } else {
        agentLogger.warn(
          `Handshake com resposta inesperada: HTTP ${res.statusCode} ${res.statusMessage ?? ""}.`,
        );
      }
    });

    socket.on("close", (code, reason) => {
      this.clearTimers();
      this.socket = null;
      if (this.manuallyDisconnected) return;

      if (this.unauthorizedAttempts >= MAX_UNAUTHORIZED_RETRIES) {
        this.setStatus("unauthorized");
        agentLogger.error(
          `Dispositivo não autorizado após ${this.unauthorizedAttempts} tentativas ` +
            `(código de fechamento ${code}). É preciso trocar de local e parear de novo.`,
        );
        return;
      }

      agentLogger.warn(
        `Conexão perdida: código ${code}${reason.length ? `, motivo "${reason.toString()}"` : ", sem motivo informado pelo servidor"}.`,
      );
      this.setStatus("error");
      this.scheduleReconnect();
    });

    socket.on("error", (error) => {
      // "close" always follows "error" for this client — reconnection is scheduled there.
      // This only records the underlying cause (DNS failure, connection refused, TLS, etc.),
      // which the "close" event's numeric code alone doesn't reveal.
      const cause = (error as NodeJS.ErrnoException).code;
      agentLogger.error(
        `Erro na conexão WebSocket com ${this.apiUrl}${cause ? ` (${cause})` : ""}: ${error.message}`,
      );
    });
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_MS,
    );
    this.reconnectAttempts += 1;
    agentLogger.info(
      `Tentando reconectar em ${Math.round(delay / 1000)}s (tentativa ${this.reconnectAttempts})...`,
    );
    this.reconnectTimer = setTimeout(() => {
      if (!this.manuallyDisconnected) this.openSocket();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "PING" });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private startPrintersPolling(): void {
    this.printersPollTimer = setInterval(() => {
      void this.pollPrinters();
    }, PRINTERS_POLL_INTERVAL_MS);
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.printersPollTimer) clearInterval(this.printersPollTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.heartbeatTimer = null;
    this.printersPollTimer = null;
    this.reconnectTimer = null;
  }

  private async pollPrinters(): Promise<void> {
    try {
      const printers = await browserPrintClient.listPrinters(
        this.browserPrintUrl,
      );
      this.printers = printers;
      this.options.onPrintersChange(printers);

      const uids = printers
        .map((p) => p.uid)
        .sort()
        .join(",");
      if (uids !== this.lastPrinterUids) {
        this.lastPrinterUids = uids;
        agentLogger.info(
          printers.length > 0
            ? `Impressoras encontradas: ${printers.map((p) => p.name).join(", ")}.`
            : "Nenhuma impressora encontrada no BrowserPrint.",
        );
      }

      this.send({
        type: "PRINTERS_REPORT",
        payload: {
          printer: printers.map((p) => ({
            uid: p.uid,
            name: p.name,
            connection: p.connection,
          })),
        },
      });
    } catch (error) {
      agentLogger.warn(
        `Não foi possível falar com o BrowserPrint em ${this.browserPrintUrl}: ` +
          `${error instanceof Error ? error.message : "erro desconhecido"}.`,
      );
    }
  }

  private async handleMessage(raw: string): Promise<void> {
    let message: AgentMessage;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    if (message.type === "PRINT_JOB") {
      await this.handlePrintJob(message.payload as PrintJobPayload);
    }
  }

  private async handlePrintJob(payload: PrintJobPayload): Promise<void> {
    const { requestId, browserPrintUid } = payload;
    agentLogger.info(
      `Job de impressão recebido: requestId=${requestId}, impressora=${browserPrintUid}, ` +
        `${payload.zpl.length} bytes de ZPL.`,
    );
    const device = this.printers.find((p) => p.uid === browserPrintUid);

    if (!device) {
      agentLogger.error(
        `Impressora ${browserPrintUid} não encontrada neste computador ` +
          `(requestId=${requestId}). Impressoras conhecidas: ` +
          `${this.printers.map((p) => p.uid).join(", ") || "nenhuma"}.`,
      );
      this.send({
        type: "PRINT_RESULT",
        payload: {
          requestId,
          status: "ERROR",
          message: "Impressora não encontrada neste computador.",
        },
      });
      return;
    }

    try {
      await browserPrintClient.printZpl(
        this.browserPrintUrl,
        device,
        payload.zpl,
      );
      agentLogger.info(
        `Impresso com sucesso em "${device.name}" (uid=${browserPrintUid}, requestId=${requestId}).`,
      );
      this.send({
        type: "PRINT_RESULT",
        payload: { requestId, status: "OK", message: null },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha desconhecida ao imprimir.";
      agentLogger.error(
        `Falha ao imprimir em "${device.name}" (uid=${browserPrintUid}, requestId=${requestId}): ${message}`,
      );
      this.send({
        type: "PRINT_RESULT",
        payload: { requestId, status: "ERROR", message },
      });
    }
  }

  private send(message: AgentMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private setStatus(status: AgentStatus): void {
    this.status = status;
    this.options.onStatusChange(status);
  }
}
