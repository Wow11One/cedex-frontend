import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { entryFunctions } from "@econia-labs/sdk";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { type GetStaticProps } from "next";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { Header } from "@/components/Header";
import { useAptos } from "@/contexts/AptosContext";
import { FAUCET_ADDR, RPC_NODE_URL } from "@/env";
import { type CoinInfo } from "@/hooks/useCoinInfo";
import { ApiOrder, type ApiMarket } from "@/types/api";
import { fromRawCoinAmount } from "@/utils/coin";
import { getAllMarket } from "@/utils/helpers";
import { TypeTag } from "@/utils/TypeTag";
import Footer from "@/components/Footer";
import { CicleXIcon } from "@/components/icons/CircleXIcon";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { CustomSelect } from "@/components/Select";
import { PreviousPageIcon } from "@/components/icons/PreviousPageIcon";
import { shortenAddress } from "@/utils/formatter";
import { SmallWalletIcon } from "@/components/icons/SmallWalletIcon";
import { Button } from "@/components/Button";

const TYPE_TAGS = [
  new TypeTag(FAUCET_ADDR, "example_apt", "ExampleAPT"),
  new TypeTag(FAUCET_ADDR, "example_usdc", "ExampleUSDC"),
] as const;
const AMOUNTS = [100, 600];

interface LeaderboardData {
  rank: number;
  trader: string;
  accountValue: string;
  pnl: string;
  roi: string;
  volume: string;
}

const leaderboardData = [
  {
    rank: 1,
    trader: "0x1a2b...c3d4",
    accountValue: "$138,135.18",
    pnl: "$2,645,765.59",
    roi: "$2,300.00",
    volume: "$3,120.50",
  },
  {
    rank: 2,
    trader: "0x5e6f...7g8h",
    accountValue: "$449,693.99",
    pnl: "$240,344.42",
    roi: "$3,450.10",
    volume: "$4,200.00",
  },
  {
    rank: 3,
    trader: "0x9i0j...1k2l",
    accountValue: "$183,002.97",
    pnl: "$134,175.70",
    roi: "$3,600.40",
    volume: "$2,150.30",
  },
  {
    rank: 4,
    trader: "0x3m4n...5o6p",
    accountValue: "$205,930.80",
    pnl: "$39,223.90",
    roi: "$2,400.75",
    volume: "$5,180.20",
  },
  {
    rank: 5,
    trader: "0x7q8r...9s0t",
    accountValue: "$0.11",
    pnl: "$62,029.60",
    roi: "$1,750.00",
    volume: "$2,800.50",
  },
  {
    rank: 6,
    trader: "0x1u2v...3w4x",
    accountValue: "$4,456,915.53",
    pnl: "$21,692.30",
    roi: "$2,600.80",
    volume: "$3,700.00",
  },
  {
    rank: 7,
    trader: "0x5y6z...7a8b",
    accountValue: "$162,849.94",
    pnl: "$15,030.23",
    roi: "$3,800.60",
    volume: "$4,380.00",
  },
  {
    rank: 8,
    trader: "0x9c9d...e1f2",
    accountValue: "$487.49",
    pnl: "$10,728.29",
    roi: "$3,505.75",
    volume: "$4,750.00",
  },
  {
    rank: 9,
    trader: "0x3g4h...5i6j",
    accountValue: "$0.35",
    pnl: "$50,760.85",
    roi: "$5,000.00",
    volume: "$2,350.50",
  },
  {
    rank: 10,
    trader: "0x7k8l...9m0n",
    accountValue: "$3,600.00",
    pnl: "$9,812.93",
    roi: "$1,600.00",
    volume: "$2,580.25",
  },
];

const columnHelper = createColumnHelper<LeaderboardData>();

export default function Faucet({
  allMarketData,
}: {
  allMarketData: ApiMarket[];
  coinInfoList: CoinInfo[];
}) {
  const { account } = useAptos();
  const queryClient = useQueryClient();
  const [isLoadingArray, setIsLoadingArray] = useState<boolean[]>(
    TYPE_TAGS.map((_) => false),
  );
  const [tab, setTab] = useState<"Deposit" | "Withdraw">("Deposit");
  const [sum, setSum] = useState<string>("0.00");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    value = value.replace(",", ".");

    value = value.replace(/[^0-9.]/g, "");

    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
      value = value.replace(/^0+/, "");
    }

    if (value.includes(".")) {
      const [intPart, decPart] = value.split(".");
      value = intPart + "." + decPart.slice(0, 2);
    }

    setSum(value);
  };

  return (
    <>
      <Head>
        <title>Deposit/Withdraw | Cedra</title>
      </Head>
      <div className="relative overflow-hidden font-roboto-mono">
        <div className="flex min-h-screen flex-col">
          <Header logoHref={`/dashboard/${allMarketData[0].market_id}`} />
          <main className="z-10 m-2 mb-4 flex max-w-full flex-1 flex-col items-center justify-center  rounded p-4 lg:p-6">
            <div className="z-10 mx-4 mb-4 flex flex-col rounded bg-greenBackground/40 p-6 lg:w-[800px]">
              <div className="text-left font-roboto-mono text-3xl text-white">
                Deposit/Withdraw
              </div>

              <div className="mt-4 flex flex-1 items-center justify-between lg:mt-8 lg:flex-row">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-graySecondary">
                    Account Value
                  </div>
                  <div className="flex items-center gap-2 font-medium text-greenPrimary">
                    <SmallWalletIcon className="h-4 w-4" />
                    {shortenAddress(account?.address)}
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-center">
                  <div className="text-xs text-graySecondary">
                    Sub-Account Value
                  </div>
                  <div className="gap-2 text-white">$0.00</div>
                </div>

                <div className="hidden flex-col gap-1 text-right lg:flex lg:text-right">
                  <div className="text-xs text-graySecondary">
                    Sub-Account Value
                  </div>
                  <div className="gap-2 text-white">$0.00</div>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-1 text-center lg:hidden">
                <div className="text-xs text-graySecondary">
                  Sub-Account Value
                </div>
                <div className="gap-2 text-white">$0.00</div>
              </div>

              <div className="mt-6 grid grid-cols-2 font-roboto-mono text-base text-white">
                <div
                  className={`flex cursor-pointer items-center justify-center rounded-t-md px-2.5 py-1.5 transition-colors ${
                    tab === "Deposit"
                      ? "border-b-[3px] border-greenPrimary bg-greenPrimary/20 text-greenPrimary"
                      : "border-b border-greenSecondary hover:border-b-2"
                  } `}
                  onClick={() => setTab("Deposit")}
                >
                  Deposit
                </div>
                <div
                  className={`flex cursor-pointer items-center justify-center whitespace-nowrap rounded-t-md transition-colors ${
                    tab === "Withdraw"
                      ? "border-b-[3px] border-greenPrimary bg-greenPrimary/20 text-greenPrimary"
                      : "border-b border-greenSecondary hover:border-b-2"
                  } px-2.5 py-1.5`}
                  onClick={() => setTab("Withdraw")}
                >
                  Withdraw
                </div>
              </div>

              <div className=" mt-6 lg:mx-28">
                <div className="rounded bg-[#011E12] px-6 py-3">
                  <div className="text-xs text-white">Amount to {tab}</div>
                  <div className="my-1 flex items-start justify-between py-1">
                    <div className="flex flex-col">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={sum}
                        className="bg-transparent text-base text-white focus:outline-none"
                        onChange={handleChange}
                      />

                      <div className="text-xs text-graySecondary">
                        ${sum || "0.00"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-white">
                      USDT <USDTIcon />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-end gap-1.5">
                    <MoneyIcon />
                    <div className="text-xs text-graySecondary">
                      $110.00 USDT
                    </div>
                    <div className="rounded border border-greenSecondary px-1.5 py-0.5 text-sm text-white">
                      Max
                    </div>
                  </div>
                </div>

                <div className="mx-4 mt-3 flex items-center justify-between text-xs text-white">
                  <div>Your deposit</div>
                  <div className="">${sum || "0.00"}</div>
                </div>

                <div className="mt-6">
                  <Button variant="secondary" className="w-full !py-2.5">
                    {tab}
                  </Button>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>

        <div
          className={`absolute inset-0 -z-10 transition-opacity duration-700 ease-in-out ${
            tab === "Deposit" ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            className="absolute bottom-0 left-[-160px] h-full w-full select-none bg-no-repeat"
            src="/deposit-ellipse.png"
            alt=""
          />
          <img
            className="absolute bottom-0 left-[-160px] h-full w-full select-none bg-no-repeat"
            src="/deposit-ellipse-2.png"
            alt=""
          />
        </div>

        <div
          className={`absolute inset-0 -z-10 transition-opacity duration-700 ease-in-out ${
            tab === "Withdraw" ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            className="absolute bottom-0 right-[-160px] h-full w-full select-none bg-no-repeat"
            src="/deposit-ellipse-3.png"
            alt=""
          />
          <img
            className="absolute -bottom-10 right-[-160px] h-full w-full select-none bg-no-repeat"
            src="/deposit-ellipse-4.png"
            alt=""
          />
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const config = new AptosConfig({
    fullnode: RPC_NODE_URL,
  });
  const aptosClient = new Aptos(config);

  const coinInfoList = await Promise.all(
    TYPE_TAGS.map(async (typeTag) => {
      const res = await aptosClient.getAccountResource<CoinInfo>({
        accountAddress: typeTag.addr,
        resourceType: `0x1::coin::CoinInfo<${typeTag.toString()}>`,
      });
      return res;
    }),
  );

  const allMarketData = await getAllMarket();

  return {
    props: {
      allMarketData,
      coinInfoList,
    },
    revalidate: 600,
  };
};

const USDTIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M23.9786 11.996C23.9786 18.5906 18.6329 23.9363 12.0383 23.9363C5.44393 23.9363 0.0980225 18.5906 0.0980225 11.996C0.0980225 5.40145 5.44393 0.0556641 12.0383 0.0556641C18.6329 0.0556641 23.9786 5.40145 23.9786 11.996Z"
      fill="#1BA27A"
    />
    <path
      d="M17.6421 6.07666H6.33588V8.80621H10.6242V12.8182H13.3538V8.80621H17.6421V6.07666Z"
      fill="white"
    />
    <path
      d="M12.0151 13.2456C8.46768 13.2456 5.59162 12.6842 5.59162 11.9915C5.59162 11.299 8.46756 10.7374 12.0151 10.7374C15.5626 10.7374 18.4385 11.299 18.4385 11.9915C18.4385 12.6842 15.5626 13.2456 12.0151 13.2456ZM19.2277 12.2006C19.2277 11.3074 15.9985 10.5835 12.0151 10.5835C8.03186 10.5835 4.80249 11.3074 4.80249 12.2006C4.80249 12.9871 7.30649 13.6424 10.6246 13.7876V19.5468H13.3539V13.7898C16.6975 13.6492 19.2277 12.9911 19.2277 12.2006Z"
      fill="white"
    />
  </svg>
);

const MoneyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M5.26668 5.2666L7.06668 7.0666M8.93335 7.0666L10.7334 5.2666M5.26668 10.7333L7.06668 8.93327M8.93335 8.93327L10.7334 10.7333M3.33333 2H12.6667C13.403 2 14 2.59695 14 3.33333V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V3.33333C2 2.59695 2.59695 2 3.33333 2ZM5 5.33333C5.1841 5.33333 5.33333 5.1841 5.33333 5C5.33333 4.81591 5.1841 4.66667 5 4.66667C4.81591 4.66667 4.66667 4.81591 4.66667 5C4.66667 5.1841 4.81591 5.33333 5 5.33333ZM11 5.33333C11.1841 5.33333 11.3333 5.1841 11.3333 5C11.3333 4.81591 11.1841 4.66667 11 4.66667C10.8159 4.66667 10.6667 4.81591 10.6667 5C10.6667 5.1841 10.8159 5.33333 11 5.33333ZM5 11.3333C5.1841 11.3333 5.33333 11.1841 5.33333 11C5.33333 10.8159 5.1841 10.6667 5 10.6667C4.81591 10.6667 4.66667 10.8159 4.66667 11C4.66667 11.1841 4.81591 11.3333 5 11.3333ZM11 11.3333C11.1841 11.3333 11.3333 11.1841 11.3333 11C11.3333 10.8159 11.1841 10.6667 11 10.6667C10.8159 10.6667 10.6667 10.8159 10.6667 11C10.6667 11.1841 10.8159 11.3333 11 11.3333ZM9.33333 8C9.33333 8.73638 8.73638 9.33333 8 9.33333C7.26362 9.33333 6.66667 8.73638 6.66667 8C6.66667 7.26362 7.26362 6.66667 8 6.66667C8.73638 6.66667 9.33333 7.26362 9.33333 8Z"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
