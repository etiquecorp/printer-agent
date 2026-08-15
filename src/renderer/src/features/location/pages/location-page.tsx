import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { IconBuildingStore, IconLogout } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Logo } from "@/components/ui/logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { agentBridge } from "@/shared/services/agent-bridge";
import { useAuth } from "@/shared/stores/auth";
import { useDevice } from "@/shared/stores/device";
import { deviceService } from "@/features/device/services/devices";
import { locationsService } from "../services/locations";
import type { LocationDto } from "../types/dto";

export function LocationPage() {
  const [error, setError] = useState<string | null>(null);
  const session = useAuth((state) => state.session);
  const currentTenantId = useAuth((state) => state.currentTenantId);
  const setTenant = useAuth((state) => state.setTenant);
  const logout = useAuth((state) => state.logout);
  const setLocation = useDevice((state) => state.setLocation);

  const tenants = Object.entries(session?.tenants ?? {});

  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations", currentTenantId],
    queryFn: locationsService.findAll,
    enabled: !!currentTenantId,
  });

  const {
    mutate: pairLocation,
    isPending,
    variables: pairingLocation,
  } = useMutation({
    mutationFn: async (location: LocationDto) => {
      const device = await deviceService.register(location.id);
      await agentBridge.setDeviceToken(device.token);
      return location;
    },
    onSuccess: (location) => setLocation(location.id, location.name),
    onError: () =>
      setError(
        "Não foi possível vincular este computador ao local. Tente de novo.",
      ),
  });

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-primary p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center">
          <Logo className="w-32" variant="white" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Este computador é de qual local?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tenants.length > 1 && (
              <Select
                value={currentTenantId ?? undefined}
                onValueChange={setTenant}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Spinner /> Carregando locais...
              </div>
            )}

            {!isLoading && locations?.length === 0 && (
              <Empty className="p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconBuildingStore />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum local encontrado</EmptyTitle>
                  <EmptyDescription>
                    Cadastre um local para essa empresa no Etique antes de
                    continuar.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-2">
              {locations?.map((location) => {
                const isPairingThis =
                  isPending && pairingLocation?.id === location.id;
                return (
                  <button
                    key={location.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setError(null);
                      pairLocation(location);
                    }}
                    className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isPairingThis ? (
                      <Spinner className="size-4 text-muted-foreground" />
                    ) : (
                      <IconBuildingStore className="size-4 text-muted-foreground" />
                    )}
                    {location.name}
                  </button>
                );
              })}
            </div>
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
