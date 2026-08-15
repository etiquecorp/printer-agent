import { httpClient } from "@/shared/services/http-client";
import type { LocationDto } from "../types/dto";

export const locationsService = {
  async findAll(): Promise<LocationDto[]> {
    return httpClient.get("locations").json<LocationDto[]>();
  },
};
