import Head from "next/head";
import { useState } from "react";
import Layout from "../components/Layout";
import NewsList from "../components/NewsList";
import { useNewsSummary } from "../hooks/useDashboardData";

const NewsWatchPage = () => {
  const [limit, setLimit] = useState(5);
  const { data } = useNewsSummary(limit);

  return (
    <>
      <Head>
        <title>News Watch | Cashew Forecast</title>
      </Head>
      <Layout title="News Watch">
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="limit" style={{ marginRight: "1rem" }}>
            News items:
          </label>
          <select
            id="limit"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            style={{ padding: "0.5rem", borderRadius: "8px" }}
          >
            {[3, 5, 10].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <NewsList items={data?.top_news || []} />
      </Layout>
    </>
  );
};

export default NewsWatchPage;
