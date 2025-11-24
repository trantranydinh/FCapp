import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL
});

export const handleError = (error) => {
  if (error.response) {
    // Backend responded with error
    throw new Error(error.response.data?.message || "Request failed");
  }

  // Network error - likely backend not running
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    throw new Error(
      "Cannot connect to backend server. " +
      "Please ensure backend is running on http://localhost:8000. " +
      "Run: cd backend && npm run dev"
    );
  }

  throw new Error(error.message || "Network error");
};
