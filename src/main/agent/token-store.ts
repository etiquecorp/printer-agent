import { app, safeStorage } from "electron";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

const tokenFilePath = (): string =>
  join(app.getPath("userData"), "device.token");

export const tokenStore = {
  get(): string | null {
    const path = tokenFilePath();
    if (!existsSync(path)) return null;

    try {
      const encrypted = readFileSync(path);
      return safeStorage.decryptString(encrypted);
    } catch {
      return null;
    }
  },

  set(token: string): void {
    writeFileSync(tokenFilePath(), safeStorage.encryptString(token));
  },

  clear(): void {
    const path = tokenFilePath();
    if (existsSync(path)) {
      unlinkSync(path);
    }
  },
};
