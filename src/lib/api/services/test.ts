import type { AxiosResponse } from "axios";
import api from "../client";

// Test API
export const testApi = {
  testConnection: (): Promise<AxiosResponse<{ message: string }>> =>
    api.get("/test"),

  testDatabase: (): Promise<
    AxiosResponse<{ message: string; userCount: number; databaseUrl: string }>
  > => api.get("/test-db"),
};
