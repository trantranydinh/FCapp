import useSWR from "swr";
import { api, handleError } from "@/lib/apiClient";

const fetcher = async (url) => {
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const useDashboardOverview = () => useSWR("/api/v1/dashboard/overview", fetcher);
export const useMarketSentiment = () => useSWR("/api/v1/dashboard/market-sentiment", fetcher);
export const useNewsSummary = (limit = 5) =>
  useSWR(`/api/v1/dashboard/news-summary?limit=${limit}`, fetcher);
export const useHistoricalData = (monthsBack = 12) =>
  useSWR(`/api/v1/dashboard/historical-data?months_back=${monthsBack}`, fetcher);
