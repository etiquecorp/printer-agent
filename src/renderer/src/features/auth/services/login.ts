import { httpClient } from "@/shared/services/http-client";
import type { Session } from "@/shared/types/auth";
import type { LoginFormValues } from "../schemas/login";

export const loginService = {
  async login(dto: LoginFormValues): Promise<Session> {
    return httpClient.post("auth/login", { json: dto }).json<Session>();
  },
};
