/**
 * Client for the local Zebra BrowserPrint HTTP service. Shape confirmed against the official
 * BrowserPrint-3.1.250.js SDK and a real instance running on localhost:9100:
 *   GET  /available -> { printer: [{ deviceType, uid, provider, name, connection, version, manufacturer }] }
 *   POST /write      <- { device: { name, uid, connection, deviceType, version: 2, provider, manufacturer },
 *                          data: "<zpl>" }
 *                    -> 200 on success; on failure, a plain-text (not JSON) error body.
 *
 * The SDK's `Device.send()` always hardcodes `version: 2` in the /write payload regardless of
 * whatever `version` /available reported for that device (that field is the discovery API's own
 * version, not something to echo back) — mirrored here exactly for compatibility.
 */
export interface BrowserPrintDevice {
  uid: string;
  name: string;
  connection: string;
  deviceType?: string;
  provider?: string;
  version?: number;
  manufacturer?: string;
  [key: string]: unknown;
}

export const browserPrintClient = {
  async listPrinters(browserPrintUrl: string): Promise<BrowserPrintDevice[]> {
    const response = await fetch(`${browserPrintUrl}/available`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`BrowserPrint respondeu ${response.status}`);
    }

    const data = (await response.json()) as { printer?: BrowserPrintDevice[] };
    return data.printer ?? [];
  },

  async printZpl(
    browserPrintUrl: string,
    device: BrowserPrintDevice,
    zpl: string,
  ): Promise<void> {
    const response = await fetch(`${browserPrintUrl}/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device: {
          name: device.name,
          uid: device.uid,
          connection: device.connection,
          deviceType: device.deviceType,
          version: 2,
          provider: device.provider,
          manufacturer: device.manufacturer,
        },
        data: zpl,
      }),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `BrowserPrint respondeu ${response.status}`);
    }
  },
};
