import type { GetStaticPaths, GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";

import { DepthChart } from "@/components/DepthChart";
import { Header } from "@/components/Header";
import { DepositWithdrawFlowModal } from "@/components/modals/flows/DepositWithdrawFlowModal";
import { WalletButtonFlowModal } from "@/components/modals/flows/WalletButtonFlowModal";
import { OrderbookTable } from "@/components/OrderbookTable";
import { StatsBar } from "@/components/StatsBar";
import MobileOrderEntry from "@/components/trade/MobileOrderEntry";
import { OrderEntry } from "@/components/trade/OrderEntry";
import { OrdersTable } from "@/components/trade/OrdersTable";
import { TradeHistoryTable } from "@/components/trade/TradeHistoryTable";
import { OrderEntryContextProvider } from "@/contexts/OrderEntryContext";
import { useOrderBook } from "@/hooks/useOrderbook";
import type { ApiMarket } from "@/types/api";
import { getAllMarket } from "@/utils/helpers";
import Footer from "@/components/Footer";

type Props = {
  marketData: ApiMarket;
  allMarketData: ApiMarket[];
};

type PathParams = {
  market_id: string;
};
export interface ChartContainerProps {
  symbol: string;
}

export interface TVChartContainerProps {
  selectedMarket: ApiMarket;
  allMarketData: ApiMarket[];
}

const getChartContainer = () =>
  dynamic(
    async () => {
      try {
        return (await import("@/components/trade/LightweightChartsContainer"))
          .LightweightChartsContainer;
      } catch {
        console.warn("Fallback to lightweight chart");
        return (await import("@/components/trade/LightweightChartsContainer"))
          .LightweightChartsContainer;
      }
    },
    { ssr: false },
  );

export default function Market({ allMarketData, marketData }: Props) {
  const ChartContainer = useMemo(() => getChartContainer(), []);
  const router = useRouter();

  const [tab, setTab] = useState<"orders" | "order-book" | "trade-histories">(
    "orders",
  );

  const [newTab, setNewTab] = useState<
    "Positions" | "Open orders" | "Orders history"
  >("Positions");

  const [depositWithdrawModalOpen, setDepositWithdrawModalOpen] =
    useState<boolean>(false);
  const [walletButtonModalOpen, setWalletButtonModalOpen] =
    useState<boolean>(false);

  useEffect(() => {
    if (router.query.lwc === "true") {
      // NOTE: We may have already loaded the private charting library, but this is a feature
      // for testing and debugging, so we don't need to check if the library is already loaded.
      console.warn(
        "Force loading LightweightChartsContainer. Avoid loading both libraries in production.",
      );
    }
  }, [router.query]);

  useEffect(() => {
    const f = () => {
      const LG = 768;
      if (window.innerWidth > LG) {
        setTab("orders");
      }
    };
    window.addEventListener("resize", f);

    return () => window.removeEventListener("resize", f);
  }, []);

  const {
    data: orderbookData,
    isFetching: orderbookIsFetching,
    isLoading: orderbookIsLoading,
  } = useOrderBook(marketData?.market_id ?? 0);

  const defaultTVChartProps = useMemo(() => {
    return {
      symbol: `${marketData?.name ?? ""}`,
      selectedMarket: marketData as ApiMarket,
      allMarketData: allMarketData as ApiMarket[],
    };
  }, [marketData, allMarketData]);

  if (!allMarketData) {
    return <>Loading...</>;
  }

  if (!marketData)
    return (
      <>
        <Head>
          <title>Not Found</title>
        </Head>
        <div className="flex min-h-screen flex-col">
          <Header logoHref={`${allMarketData[0]?.market_id}`} />
          Market not found.
        </div>
      </>
    );

  return (
    <OrderEntryContextProvider>
      <Head>
        <title>{`${marketData.name} | Cedex`}</title>
      </Head>
      <div className="flex min-h-screen flex-col">
        <Header
          logoHref={`${allMarketData[0].market_id}`}
          onDepositWithdrawClick={() => setDepositWithdrawModalOpen(true)}
          onWalletButtonClick={() => setWalletButtonModalOpen(true)}
        />

        <main className="flex h-full w-full grow flex-col gap-3 p-3 md:flex-row">
          <div className="flex min-h-[680px] flex-col gap-3 pb-0 md:w-[calc(100%-296px)] lg:w-[calc(100%-292px)]">
            <div className="flex flex-1 gap-3">
              <div className="flex grow flex-col">
                <StatsBar
                  allMarketData={allMarketData}
                  selectedMarket={marketData}
                />
                <div className="flex h-full min-h-[400px] md:min-h-[unset]">
                  <ChartContainer {...defaultTVChartProps} />
                </div>

                <div className="hidden h-[140px] tall:block">
                  <DepthChart marketData={marketData} />
                </div>
              </div>
              <div className="hidden w-[292px] lg:flex">
                <div className="flex w-full flex-col">
                  <OrderbookTable
                    marketData={marketData}
                    data={orderbookData}
                    isFetching={orderbookIsFetching}
                    isLoading={orderbookIsLoading}
                  />
                </div>
              </div>
            </div>

            <div className="my-2 flex max-w-full flex-col lg:hidden">
              <OrderbookTable
                marketData={marketData}
                data={orderbookData}
                isFetching={orderbookIsFetching}
                isLoading={orderbookIsLoading}
              />
            </div>
            <div className="flex min-h-[200px] max-w-full flex-col">
              <div className="flex items-center gap-4  pt-2  lg:pt-[6px]">
                {/* <div className="flex gap-4 py-1 text-base lg:py-3 lg:pl-[17.19px]">
                  <p
                    onClick={() => setTab("orders")}
                    className={`cursor-pointer font-jost font-bold ${
                      tab === "orders" ? "text-white" : "text-neutral-600"
                    }`}
                  >
                    Orders
                  </p>
                  <p
                    onClick={() => setTab("order-book")}
                    className={`cursor-pointer font-jost font-bold lg:hidden ${
                      tab === "order-book" ? "text-white" : "text-neutral-600"
                    }`}
                  >
                    Order Book
                  </p>
                  <p
                    onClick={() => setTab("trade-histories")}
                    className={`cursor-pointer font-jost font-bold md:hidden ${
                      tab === "trade-histories"
                        ? "text-white"
                        : "text-neutral-600"
                    }`}
                  >
                    Trade History
                  </p>
                </div> */}

                <div className="mt-3 grid grid-cols-3 font-roboto-mono text-sm text-white md:mx-4 lg:text-base">
                  <button
                    key={"Positions"}
                    className={`flex cursor-pointer items-center justify-center whitespace-nowrap rounded-t-md px-14 py-2.5 transition-colors ${
                      newTab === "Positions"
                        ? "border-b-[3px] border-greenPrimary bg-greenPrimary/20 text-greenPrimary"
                        : "border-b border-greenSecondary hover:border-b-2"
                    }`}
                    // onClick={(event) => {
                    //   event.preventDefault();
                    //   setNewTab("Positions");
                    // }}
                  >
                    Positions
                  </button>
                  <button
                    key={"Open orders"}
                    className={`flex cursor-pointer items-center justify-center whitespace-nowrap rounded-t-md transition-colors ${
                      newTab === "Open orders"
                        ? "border-b-[3px] border-greenPrimary bg-greenPrimary/20 text-greenPrimary"
                        : "border-b border-greenSecondary hover:border-b-2"
                    }`}
                    // onClick={(event) => {
                    //   event.preventDefault();
                    //   setNewTab("Open orders");
                    // }}
                  >
                    Open orders
                  </button>
                  <button
                    key={"Orders history"}
                    className={`flex cursor-pointer items-center justify-center whitespace-nowrap rounded-t-md transition-colors ${
                      newTab === "Orders history"
                        ? "border-b-[3px] border-greenPrimary bg-greenPrimary/20 text-greenPrimary"
                        : "border-b border-greenSecondary hover:border-b-2"
                    }`}
                    // onClick={(event) => {
                    //   event.preventDefault();
                    //   setNewTab("Orders history");
                    // }}
                  >
                    Orders history
                  </button>
                </div>
              </div>

              {tab === "orders" && (
                <OrdersTable
                  market_id={marketData.market_id}
                  marketData={marketData}
                />
              )}
              {/* {tab === "trade-histories" && (
                <div className="h-full overflow-hidden">
                  <TradeHistoryTable
                    marketData={marketData}
                    marketId={marketData?.market_id}
                  />
                </div>
              )}
              {tab === "order-book" && (
                <OrderbookTable
                  marketData={marketData}
                  data={orderbookData}
                  isFetching={orderbookIsFetching}
                  isLoading={orderbookIsLoading}
                />
              )} */}
            </div>
          </div>
          <div className="hidden w-[292px] flex-col md:flex">
            <OrderEntry
              marketData={marketData}
              onDepositWithdrawClick={() => setDepositWithdrawModalOpen(true)}
            />
            <div className="scrollbar-none my-4 flex h-full max-h-full grid-rows-none flex-col justify-center overflow-hidden">
              <p className=" flex  h-[30px] items-end border-b border-greenSecondary bg-greenBackground pb-1 pl-[17.03px]  font-roboto-mono text-white">
                Account Equity
              </p>
              <TradeHistoryTable
                marketData={marketData}
                marketId={marketData?.market_id}
              />
            </div>
          </div>
          <MobileOrderEntry
            marketData={marketData}
            onDepositWithdrawClick={() => setDepositWithdrawModalOpen(true)}
          />
        </main>

        <Footer />
      </div>
      {/* temp */}
      <DepositWithdrawFlowModal
        selectedMarket={marketData}
        isOpen={depositWithdrawModalOpen}
        onClose={() => {
          setDepositWithdrawModalOpen(false);
        }}
        allMarketData={allMarketData}
      />
      <WalletButtonFlowModal
        selectedMarket={marketData}
        isOpen={walletButtonModalOpen}
        onClose={() => {
          setWalletButtonModalOpen(false);
        }}
        allMarketData={allMarketData}
      />
    </OrderEntryContextProvider>
  );
}

export const getStaticPaths: GetStaticPaths<PathParams> = async () => {
  const allMarketData = await getAllMarket();
  const paths = allMarketData.map((market: ApiMarket) => ({
    params: { market_id: `${market.market_id}` },
  }));
  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) throw new Error("No params");
  const allMarketData = await getAllMarket();
  const marketData =
    allMarketData?.find(
      (market) => `${market?.market_id}` === params.market_id,
    ) || null;

  return {
    props: {
      marketData,
      allMarketData,
    },
    revalidate: 600,
  };
};
