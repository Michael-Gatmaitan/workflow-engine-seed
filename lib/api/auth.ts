import { apiClient } from "@/lib/axios";

export interface LoginApiResponse {
  authorization?: { token?: string };
  user?: {
    id?: number;
    email?: string;
    user_name?: string;
    roles?: { type?: string }[];
  };
  current_house?: { name?: string };
}

export async function loginRequest(email: string, password: string) {
  const { data } = await apiClient.post<LoginApiResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}
