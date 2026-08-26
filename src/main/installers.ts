import { app, shell } from "electron";
import { join } from "path";

// Installers are shipped via electron-builder's `extraResources` (see
// electron-builder.yml), landing next to the app as real files — not inside
// app.asar — since shell.openPath() hands the path to the OS shell, which
// can't read into an asar archive.
const installersDir = app.isPackaged
  ? join(process.resourcesPath, "installers")
  : join(__dirname, "../../resources/installers");

const BROWSER_PRINT_INSTALLER = join(
  installersDir,
  "zebra-browser-print-windows-v132489.exe",
);
const DRIVER_INSTALLER = join(
  installersDir,
  "zddriver-v1062628275-certified.exe",
);

export async function runBrowserPrintInstaller(): Promise<void> {
  const error = await shell.openPath(BROWSER_PRINT_INSTALLER);
  if (error) throw new Error(error);
}

export async function runDriverInstaller(): Promise<void> {
  const error = await shell.openPath(DRIVER_INSTALLER);
  if (error) throw new Error(error);
}
