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
  coinInfoList,
}: {
  allMarketData: ApiMarket[];
  coinInfoList: CoinInfo[];
}) {
  const { account } = useAptos();
  const queryClient = useQueryClient();
  const [isLoadingArray, setIsLoadingArray] = useState<boolean[]>(
    TYPE_TAGS.map((_) => false),
  );

  useEffect(() => {
    queryClient.invalidateQueries(["balance", account?.address]);
  }, [account?.address, queryClient]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("rank", {
        header: () => <span className="pl-2">Rank</span>,
        cell: (info) => (
          <div
            className={`flex flex-col gap-2 pl-2 font-roboto-mono text-sm text-white ${
              info.getValue() === 5 ? "!text-[#01FFFF]" : ""
            }`}
          >
            {info.getValue()} {info.getValue() === 5 && "You"}
          </div>
        ),
        size: 70,
      }),
      columnHelper.accessor("trader", {
        header: "Trader",
        cell: (info) => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-sm text-white">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("accountValue", {
        header: "Account Value",
        cell: (info) => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-sm text-white">
            <div>{info.getValue()}</div>
          </div>
        ),
      }),
      columnHelper.accessor("pnl", {
        header: "PNL (30D)",
        cell: (info) => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-sm text-greenPrimary">
            <div>{info.getValue()}</div>
          </div>
        ),
      }),
      columnHelper.accessor("roi", {
        header: "ROI (30D)",
        cell: (info) => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-sm text-greenPrimary">
            <div>{info.getValue()}</div>
          </div>
        ),
      }),
      columnHelper.accessor("volume", {
        header: () => <div className="pr-2 text-right">Volume (30D)</div>,
        cell: (info) => (
          <div className="flex flex-col items-end gap-2 pr-2 text-right font-roboto-mono text-sm text-white">
            <div>{info.getValue()}</div>
          </div>
        ),
        size: 85,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: leaderboardData,
    columns,
    state: {
      //sorting,
    },
    //onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <Head>
        <title>Leaderboard | Cedra</title>
      </Head>
      <div className="relative ">
        <div className="flex min-h-screen flex-col">
          <Header logoHref={`/dashboard/${allMarketData[0].market_id}`} />
          <main className="z-10  m-2 mb-4 flex max-w-full flex-1 flex-col items-center justify-center  rounded p-4 lg:p-6">
            <div className="z-10 mb-4 flex max-w-full flex-col rounded bg-greenBackground/40 p-6 lg:max-w-[1200px]">
              <div className="text-left font-roboto-mono text-3xl text-white">
                Leaderboard
              </div>

              <div className="mt-6 flex flex-col-reverse items-center justify-between gap-4 lg:flex-row">
                <input
                  type="text"
                  id="search"
                  className="w-[250px] rounded-sm bg-white/10 px-3.5 py-2 font-roboto-mono text-sm text-white placeholder-graySecondary ring-0 focus:outline-none lg:w-[400px]"
                  placeholder="Search by wallet address..."
                />
                <div className=" grid grid-cols-4 font-roboto-mono text-base text-white">
                  <div className="flex cursor-pointer items-center justify-center border-b border-greenSecondary font-roboto-mono hover:border-b-2">
                    24H
                  </div>
                  <div className="flex cursor-pointer items-center justify-center border-b border-greenSecondary font-roboto-mono hover:border-b-2">
                    3D
                  </div>
                  <div className="flex cursor-pointer items-center justify-center border-b border-greenSecondary font-roboto-mono hover:border-b-2">
                    7D
                  </div>
                  <div className="flex cursor-pointer items-center justify-center whitespace-nowrap rounded-t-md border-b-[3px] border-greenPrimary bg-greenPrimary/20 px-2.5 py-1.5 text-greenPrimary">
                    30D
                  </div>
                </div>
              </div>

              <div className="scrollbar-none w-full grow overflow-auto">
                <table className={"mt-4 w-full table-fixed "}>
                  <thead className="sticky top-0 h-[30px] bg-greenBackground">
                    <tr className="h-[30px]">
                      {table.getFlatHeaders().map((header) => (
                        <th
                          className="cursor-pointer select-none text-left font-roboto-mono text-xs font-normal tracking-[0.24px] text-graySecondary transition-all"
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          style={{
                            width: header.getSize(),
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {table.getFlatHeaders().map((header) => (
                        <td className="p-0" key={header.id}></td>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        className="cursor-pointer transition-colors hover:bg-greenTertiary"
                        key={row.id}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            className="h-7 py-2 text-left font-roboto-mono text-xs font-normal leading-[18px] tracking-[0.24px] text-white"
                            key={cell.id}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col items-center justify-between gap-2 font-roboto-mono lg:flex-row">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-white">Row in page</div>
                  <CustomSelect
                    disableCheckIcon
                    options={["10", "20", "50", "100"]}
                    value="10"
                    onChange={() => {}}
                    padding="py-1 px-3 !text-sm"
                    position="top"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm text-graySecondary">
                  <div className="hidden rounded bg-white/5 px-4 py-2 lg:block">
                    page ##
                  </div>

                  <div className="flex items-center gap-2">
                    <PreviousPageIcon className="text-white" />
                    <div className="cursor-pointer text-greenPrimary">1</div>
                    <div className="cursor-pointer">2</div>
                    <div className="cursor-pointer">3</div>
                    <div className="cursor-pointer">...</div>
                    <div className="cursor-pointer">999</div>
                    <div className="cursor-pointer">1000</div>
                    <PreviousPageIcon className="rotate-180 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>

        <img
          className="absolute bottom-0 left-0 w-full bg-no-repeat"
          src="/leaderboard-eclipse.png"
        />

        <img
          className="absolute bottom-0 left-0 w-full bg-no-repeat"
          src="/leaderboard-eclipse-2.png"
        />
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
