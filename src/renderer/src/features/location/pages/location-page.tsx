import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { IconLogout } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

import { agentBridge } from "@/shared/services/agent-bridge";
import { useAuth } from "@/shared/stores/auth";
import { useDevice } from "@/shared/stores/device";
import { deviceService } from "@/features/device/services/devices";

export function LocationPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const logout = useAuth((state) => state.logout);
  const setDeviceName = useDevice((state) => state.setDeviceName);

  const { mutate: pair, isPending } = useMutation({
    mutationFn: async (deviceName: string) => {
      const device = await deviceService.register(deviceName);
      await agentBridge.setDeviceToken(device.token);
      return device.name;
    },
    onSuccess: (deviceName) => setDeviceName(deviceName),
    onError: () =>
      setError(
        "Não foi possível vincular este computador. Tente de novo.",
      ),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Digite pelo menos 2 caracteres.");
      return;
    }
    setError(null);
    pair(trimmed);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-primary p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center">
          <Logo className="w-32" variant="white" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Como chamar este computador?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Ex: Computador da Cozinha"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || name.trim().length < 2}
              >
                {isPending ? "Vinculando..." : "Vincular este computador"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          className="w-full text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          onClick={logout}
        >
          <IconLogout className="size-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
