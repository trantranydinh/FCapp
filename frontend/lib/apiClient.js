import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const api = axios.create({
  baseURL,
  withCredentials: true
});

export const handleError = (error) => {
  if (error.response) {
    // Backend responded with error
    console.error("[API Error]", {
      status: error.response.status,
      url: error.response.config?.url,
      data: error.response.data
    });
    const backendMessage = error.response.data?.message || error.response.data?.error;
    throw new Error(backendMessage || `Request failed with status ${error.response.status}`);
  }

  // Network error - likely backend not running
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    throw new Error(
      "Cannot connect to backend server. " +
      "Please ensure backend is running on http://localhost:50005. " +
      "Run: cd backend && npm run dev"
    );
  }

  throw new Error(error.message || "Network error");
};
