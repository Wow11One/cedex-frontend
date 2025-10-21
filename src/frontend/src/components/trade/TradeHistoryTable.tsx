import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import Skeleton from "@/components/Skeleton";
import { API_URL } from "@/env";
import { type ApiMarket, type TradeHistory } from "@/types/api";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";

import { TokenSymbol } from "../TokenSymbol";

const columnHelper = createColumnHelper<TradeHistory>();

export const TradeHistoryTable: React.FC<{
  className?: string;
  marketData: ApiMarket;
  marketId: number;
}> = ({ className, marketData, marketId }) => {
  const { base, quote } = marketData;
  const baseSymbol = base?.symbol;
  const quoteSymbol = quote?.symbol;

  const { data, isLoading } = useQuery<TradeHistory[]>(
    ["useTradeHistory", marketData.market_id],
    async () => {
      const response = await fetch(
        `${API_URL}/fill_events_deduped?order=txn_version.desc,event_idx.desc&market_id=eq.${marketId}&limit=100`,
      );
      const data = await response.json();
      return data;
    },
  );
  const table = useReactTable({
    columns: [
      columnHelper.accessor("price", {
        cell: (info) => {
          const price = info.getValue();
          return toDecimalPrice({
            price,
            marketData,
          }).toNumber();
        },
        header: () => (
          <span className="flex items-baseline gap-2 whitespace-nowrap pt-0 md:pt-[2px]">
            PRICE <TokenSymbol symbol={quoteSymbol} />
          </span>
        ),
      }),
      columnHelper.accessor("size", {
        cell: (info) => {
          const size = info.getValue();
          return toDecimalSize({
            size,
            marketData,
          }).toNumber();
        },
        header: () => (
          <span className="flex items-baseline gap-2 whitespace-nowrap pt-0 md:pt-[2px]">
            AMOUNT <TokenSymbol symbol={baseSymbol} />
          </span>
        ),
      }),
      columnHelper.accessor("time", {
        cell: (info) => {
          const timestampString = info.getValue();
          const timestamp = new Date(timestampString);
          const currentTime = new Date();
          const timeDifference = currentTime.getTime() - timestamp.getTime();
          const hoursDifference = timeDifference / (1000 * 60 * 60);
          if (hoursDifference < 24)
            return (
              <span className="whitespace-nowrap">
                {new Date(timestampString).toLocaleString("en", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            );
          return (
            <div className="flex flex-col">
              <span>
                {new Date(timestampString).toLocaleString("en", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </span>
              <span>
                {new Date(timestampString).toLocaleString("en", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
          );
        },
        header: () => (
          <span className="flex items-baseline justify-end gap-2 whitespace-nowrap pt-0 md:pt-[2px]">
            TIME
          </span>
        ),
      }),
    ],
    data: data || [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="mt-4 flex flex-col gap-4 md:mx-4">
        <div className="flex items-center justify-between font-roboto-mono">
          <div className="text-xs text-graySecondary">Spot</div>
          <div className="text-xs text-white">0.00 $</div>
        </div>

        <div className="flex items-center justify-between font-roboto-mono">
          <div className="text-xs text-graySecondary">Perps</div>
          <div className="text-xs text-white">0.00 $</div>
        </div>
      </div>
    </>
  );
};
