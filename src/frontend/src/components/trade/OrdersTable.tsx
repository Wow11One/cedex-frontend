import { type InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { type Side } from "@econia-labs/sdk/dist/src/order";
import { sideToBoolean } from "@econia-labs/sdk/dist/src/utils";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

import Skeleton from "@/components/Skeleton";
import { useAptos } from "@/contexts/AptosContext";
import { API_URL, ECONIA_ADDR } from "@/env";
import { type ApiMarket, type ApiOrder } from "@/types/api";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";

import { BaseModal } from "../modals/BaseModal";
import { OrderDetailsModalContent } from "./OrderDetailsModalContent";
import { CicleXIcon } from "../icons/CircleXIcon";

const columnHelper = createColumnHelper<ApiOrder>();

export const OrdersTable: React.FC<{
  className?: string;
  market_id: number;
  marketData: ApiMarket;
}> = ({ className, market_id, marketData }) => {
  const { signAndSubmitTransaction } = useAptos();
  const { base, quote, name } = marketData;
  const { symbol: baseSymbol } = base;
  const { symbol: quoteSymbol } = quote;
  const { connected, account } = useWallet();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCancelingOrder, setIsCancelingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const { data, isLoading, refetch } = useQuery<ApiOrder[]>(
    ["useUserOrders", market_id, account?.address],
    async () => {
      if (!account) return [];
      const limit = 100;
      const response = await fetch(
        `${API_URL}/orders?user=eq.${account.address}&order=created_at.desc&market_id=eq.${market_id}&limit=${limit}`,
      );
      const responseText = await response.text();
      const orders = JSON.parse(
        responseText.replace(/"order_id":(\d+)/g, '"order_id":"$1"'),
      );
      return orders;
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchInterval: 10 * 1000,
    },
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  }, []);

  const cancelOrder = useCallback(
    async (orderInfo: ApiOrder) => {
      try {
        setIsCancelingOrder(true);
        const { direction, order_id } = orderInfo;
        let side = direction;
        switch (direction) {
          case "buy":
            side = "bid";
            break;
          case "sell":
            side = "ask";
            break;
          default:
            side = direction;
            break;
        }

        const payload: InputEntryFunctionData = {
          functionArguments: [
            market_id.toString(),
            sideToBoolean(side as Side),
            order_id,
          ],
          function: `${ECONIA_ADDR}::market::cancel_order_user`,
        };
        // await signAndSubmitTransaction({ data: payload });
        refetch();

        // close modal if it's open
        if (isModalOpen) closeModal();
      } catch (error) {
        console.error("Error while cancelling order:", error);
      } finally {
        setIsCancelingOrder(false);
      }
    },
    [closeModal, isModalOpen, market_id, refetch, signAndSubmitTransaction],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("created_at", {
        header: () => <span className="pl-4">Coin</span>,
        cell: (info) => (
          <div className="flex flex-col items-start gap-1 pl-4 font-roboto-mono text-xs text-white">
            <div>ETH</div>
            <div className="text-redPrimary">20x Short</div>
          </div>
        ),
        size: 174.19,
      }),
      columnHelper.display({
        header: "Name",
        cell: (info) => (
          <div className="flex flex-col items-start gap-1 font-roboto-mono text-xs text-white">
            <div>0.0012 ETH</div>
            <div className="text-graySecondary">$208.23</div>
          </div>
        ),
      }),
      columnHelper.accessor("order_type", {
        header: "Position Value",
        cell: (info) => (
          <div className="flex flex-col items-start gap-1 font-roboto-mono text-xs text-white">
            <div>$6.799,02</div>
          </div>
        ),
      }),
      columnHelper.accessor("direction", {
        header: "Mark Prise",
        cell: (info) => (
          <div className="flex flex-col items-start gap-1 font-roboto-mono text-xs text-white">
            <div>1.799,02</div>
          </div>
        ),
      }),
      columnHelper.accessor("price", {
        header: "PnL (ROE %)",
        cell: (info) => (
          <div className="flex flex-col items-start gap-1 font-roboto-mono text-xs text-greenPrimary">
            <div>+$0.62</div>
            <div>(+5.43%)</div>
          </div>
        ),
      }),
      columnHelper.accessor("average_execution_price", {
        header: "Liquid price",
        cell: (info) => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-xs text-white">
            <div>N / A</div>
          </div>
        ),
      }),
      columnHelper.accessor("remaining_size", {
        header: "Margin",
        cell: (info) => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-xs text-white">
            <div>$210.44</div>
          </div>
        ),
      }),
      columnHelper.accessor("total_filled", {
        header: "Funding",
        cell: (info) => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-xs text-redPrimary">
            <div>-0.01</div>
          </div>
        ),
      }),
      columnHelper.display({
        header: "TP/SL",
        cell: (info) => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-xs text-white">
            <div>--</div>
          </div>
        ),
      }),
      columnHelper.accessor("order_status", {
        header: () => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-xs text-greenPrimary">
            <div className="flex items-center gap-1 bg-greenTertiary px-1.5 py-1 transition-colors hover:bg-greenSecondary">
              <CicleXIcon />
              <div>Close All</div>
            </div>
          </div>
        ),
        cell: (info) => (
          <div className="flex flex-col items-start gap-2 font-roboto-mono text-xs text-greenPrimary">
            <div className="flex items-center gap-1 bg-greenTertiary px-1.5 py-1 transition-colors hover:bg-greenSecondary">
              <CicleXIcon />
              <div>Close</div>
            </div>
          </div>
        ),
      }),
    ],
    [baseSymbol, cancelOrder, marketData, name, quoteSymbol],
  );

  const table = useReactTable({
    data: [{} as any, {} as any],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="scrollbar-none w-full grow overflow-auto">
      <BaseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        showCloseButton={true}
        showBackButton={false}
        className="!w-[480px] !p-0 font-jost text-white"
      >
        <OrderDetailsModalContent
          orderDetails={selectedOrder}
          baseSymbol={baseSymbol}
          quoteSymbol={quoteSymbol}
          marketData={marketData}
          cancelOrder={cancelOrder}
          loading={isCancelingOrder}
        />
      </BaseModal>
      <table
        className={"w-full table-fixed" + (className ? ` ${className}` : "")}
      >
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
          {isLoading || !data ? (
            <>
              <tr>
                {table.getAllColumns().map((column, i) => (
                  <td
                    className={`${
                      i === 0
                        ? "pl-4 text-left text-graySecondary"
                        : i === 6
                        ? ""
                        : ""
                    }`}
                    key={column.id}
                  >
                    <div className={"pr-3"}>
                      <Skeleton />
                    </div>
                  </td>
                ))}
              </tr>
            </>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                className="cursor-pointer transition-colors hover:bg-neutral-600/30"
                key={row.id}
                onClick={() => {
                  setIsModalOpen(true);
                  setSelectedOrder(row.original);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    className="h-7 py-2 text-left font-roboto-mono text-xs font-normal leading-[18px] tracking-[0.24px] text-white"
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
