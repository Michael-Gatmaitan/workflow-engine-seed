import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.AUTH_API_BASE_URL ?? "http://localhost:8000/api",
  headers: {
    "X-Tenant": process.env.AUTH_API_TENANT ?? "rmhcsc",
  },
});
