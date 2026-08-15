import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { IconSettings } from "@tabler/icons-react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";

import { agentBridge } from "@/shared/services/agent-bridge";
import { useAuth } from "@/shared/stores/auth";
import { useSettings } from "@/shared/stores/settings";
import { loginSchema, type LoginFormValues } from "../schemas/login";
import { loginService } from "../services/login";

export function LoginPage() {
  const [showSettings, setShowSettings] = useState(false);
  const setLoggedIn = useAuth((state) => state.setLoggedIn);
  const apiUrl = useSettings((state) => state.apiUrl);
  const setApiUrl = useSettings((state) => state.setApiUrl);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: "", password: "" },
  });

  const {
    mutate: login,
    isPending,
    error,
  } = useMutation({
    mutationFn: loginService.login,
    onSuccess: setLoggedIn,
  });

  function onSubmit(values: LoginFormValues) {
    login(values);
  }

  return (
    <div className="flex min-h-svh flex-col bg-primary">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center">
            <Logo className="w-36" />
            <p className="mt-2 text-sm text-primary-foreground/80">
              Agente de impressão
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 rounded-md bg-background px-8 py-6"
          >
            <Field>
              <FieldLabel htmlFor="login">E-mail ou usuário</FieldLabel>
              <Input
                id="login"
                type="text"
                placeholder="seu@email.com"
                autoComplete="username"
                {...register("login")}
              />
              <FieldError errors={[errors.login]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <FieldError
              errors={[error ? { message: error.message } : undefined]}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Spinner />}
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="rounded-md bg-background/10">
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs text-primary-foreground/70 hover:text-primary-foreground"
            >
              <IconSettings className="size-3.5" />
              Servidor: {apiUrl}
            </button>

            {showSettings && (
              <div className="space-y-2 border-t border-primary-foreground/15 p-3">
                <FieldLabel
                  htmlFor="api-url"
                  className="text-primary-foreground"
                >
                  Endereço do servidor
                </FieldLabel>
                <Input
                  id="api-url"
                  defaultValue={apiUrl}
                  onBlur={(e) => {
                    setApiUrl(e.target.value);
                    void agentBridge.updateSettings({ apiUrl: e.target.value });
                  }}
                  className="bg-background"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
