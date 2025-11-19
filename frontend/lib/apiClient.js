import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL
});

export const handleError = (error) => {
  if (error.response) {
    throw new Error(error.response.data?.message || "Request failed");
  }
  throw new Error(error.message || "Network error");
};
