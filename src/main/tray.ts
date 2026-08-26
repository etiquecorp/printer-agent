import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";

let tray: Tray | null = null;

export function createTray(
  mainWindow: BrowserWindow,
  iconPath: string,
  onQuit: () => void,
): Tray {
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip("Agente de Impressão Etiquê");

  const menu = Menu.buildFromTemplate([
    {
      label: "Mostrar",
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: "separator" },
    {
      label: "Sair",
      click: onQuit,
    },
  ]);
  tray.setContextMenu(menu);

  tray.on("click", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}

export function setLoginItemEnabled(enabled: boolean): void {
  app.setLoginItemSettings({ openAtLogin: enabled });
}

export function isLoginItemEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}
