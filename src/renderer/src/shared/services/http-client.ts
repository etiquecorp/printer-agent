import ky, { HTTPError, type Options } from "ky";
import { useSettings } from "@/shared/stores/settings";
import { useAuth } from "@/shared/stores/auth";

function request(path: string, options?: Options) {
  const { apiUrl } = useSettings.getState();
  const auth = useAuth.getState();

  return ky(`${apiUrl}/${path.replace(/^\/+/, "")}`, {
    ...options,
    hooks: {
      beforeRequest: [
        ({ request }) => {
          if (auth.session?.token) {
            request.headers.set(
              "Authorization",
              `Bearer ${auth.session.token}`,
            );
          }
          if (auth.currentTenantId) {
            request.headers.set("X-Tenant-ID", auth.currentTenantId);
          }
        },
      ],
      afterResponse: [
        ({ response }) => {
          if (response.status === 401) {
            useAuth.getState().logout();
          }
        },
      ],
      beforeError: [
        async ({ error }) => {
          if (!(error instanceof HTTPError)) return error;

          const fallback = `Erro ${error.response?.status ?? "desconhecido"}. Tente novamente.`;
          const body = (await error.response?.json().catch(() => undefined)) as
            { message?: string } | undefined;

          error.message = body?.message ?? fallback;
          return error;
        },
      ],
    },
  });
}

export const httpClient = {
  get: (path: string, options?: Options) =>
    request(path, { ...options, method: "get" }),
  post: (path: string, options?: Options) =>
    request(path, { ...options, method: "post" }),
};
