import { httpClient } from "@/shared/services/http-client";

interface DeviceRegisterResponse {
  id: number;
  name: string;
  token: string;
}

export const deviceService = {
  async register(name: string): Promise<DeviceRegisterResponse> {
    return httpClient
      .post("devices/register", { json: { name } })
      .json<DeviceRegisterResponse>();
  },
};
