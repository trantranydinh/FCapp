import Head from "next/head";
import DashboardLayout from "../components/DashboardLayout";
import ParityTool from "../components/ParityTool";

const DashboardPage = () => {
  return (
    <>
      <Head>
        <title>Command Center | Intersnack Forecast</title>
      </Head>
      <DashboardLayout title="Parity Tool">
        <div className="space-y-6">
          <ParityTool />
        </div>
      </DashboardLayout>
    </>
  );
};

export default DashboardPage;
