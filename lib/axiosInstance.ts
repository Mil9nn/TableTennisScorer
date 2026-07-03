import axios from "axios";
import { getApiBaseUrl } from "@/lib/appOrigin";

// Do not set a default Content-Type. If it is forced to application/json, axios will JSON-serialize
// FormData and break multipart uploads. JSON bodies still get application/json automatically.
export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const body = config.data as unknown;
  const isMultipart =
    typeof FormData !== "undefined" &&
    body instanceof FormData;
  if (!isMultipart) return config;

  const h = config.headers;
  if (h && typeof h.delete === "function") {
    h.delete("Content-Type");
  } else if (h && typeof h === "object") {
    delete (h as Record<string, unknown>)["Content-Type"];
    delete (h as Record<string, unknown>)["content-type"];
  }
  return config;
});
