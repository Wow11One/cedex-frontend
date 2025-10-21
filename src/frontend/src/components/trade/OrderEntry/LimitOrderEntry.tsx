import { entryFunctions, type order, viewFunctions } from "@econia-labs/sdk";
import { useQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/Button";
import { ConnectedButton } from "@/components/ConnectedButton";
import RangeSlider from "@/components/slider-order/RangeSlider";
import { useAptos } from "@/contexts/AptosContext";
import { useOrderEntry } from "@/contexts/OrderEntryContext";
import { ECONIA_ADDR, INTEGRATOR_ADDRESS } from "@/env";
import { useOrderBookData } from "@/features/hooks";
import { useBalance } from "@/hooks/useBalance";
import { type ApiMarket } from "@/types/api";
import { type Side } from "@/types/global";
import { toRawCoinAmount } from "@/utils/coin";
import { fromDecimalPrice, toDecimalPrice } from "@/utils/econia";
import { formatDecimal } from "@/utils/formatter";
import { TypeTag } from "@/utils/TypeTag";

import { OrderEntryInfo } from "./OrderEntryInfo";
import { OrderEntryInputWrapper } from "./OrderEntryInputWrapper";
import { MarketInput } from "@/components/MarketInput";
import { Checkbox } from "@/components/Checkbox";
type LimitFormValues = {
  price: string | undefined;
  size: string;
  totalSize: string;
};
export const HI_PRICE = 4294967295;
export const MIN_PRICE = 1;

export const LimitOrderEntry: React.FC<{
  tab: "Market" | "Limit";
  marketData: ApiMarket;
  side: Side;
  onDepositWithdrawClick?: () => void;
}> = ({ marketData, side, onDepositWithdrawClick, tab }) => {
  const { signAndSubmitTransaction, aptosClient } = useAptos();
  const {
    handleSubmit,
    register,
    formState,
    getValues,
    setValue,
    setError,
    watch,
  } = useForm<LimitFormValues>({
    defaultValues: {
      price: undefined,
    },
  });

  const { errors } = formState;
  const { data: takerFeeDivisor } = useQuery(["takerFeeDivisor"], async () => {
    try {
      return await viewFunctions.getTakerFeeDivisor(aptosClient, ECONIA_ADDR);
    } catch (e) {
      return 2000;
    }
  });
  const [percent, setPercent] = useState(0);

  const [price, setPrice] = useState<string>("0,00");
  const [size, setSize] = useState<string>("0,00");
  const [sizeSelect, setSizeSelect] = useState<string>("ETH");
  const [isReduce, setIsReduce] = useState<boolean>(true);
  const [isProfit, setIsProfit] = useState<boolean>(false);

  const { balance } = useBalance(marketData);
  const watchPrice = watch("price", undefined);

  const watchSize = watch("size");

  //const { price } = useOrderEntry();

  useEffect(() => {
    if (price) {
      setValue("price", Number(Number(price).toFixed(3)).toString());
    }
  }, [price, setValue]);

  const { highestBid, lowestAsk } = useOrderBookData(marketData);

  const estimateFee = useMemo(() => {
    let totalSize = Number(watchPrice) * Number(watchSize);
    if (!takerFeeDivisor || !totalSize) {
      return "--";
    }
    if (watchPrice === undefined || !lowestAsk || !highestBid) {
      return "--";
    }

    let takerWeight = 0;
    if (
      side === "buy" &&
      Number(watchPrice) >=
        toDecimalPrice({
          price: Number(lowestAsk.price),
          marketData,
        }).toNumber()
    ) {
      totalSize =
        toDecimalPrice({
          price: Number(lowestAsk.price),
          marketData,
        }).toNumber() * Number(watchSize);
      takerWeight = 1;
    }

    if (
      side === "sell" &&
      Number(watchPrice) <=
        toDecimalPrice({
          price: Number(highestBid.price),
          marketData,
        }).toNumber()
    ) {
      totalSize =
        toDecimalPrice({
          price: Number(highestBid.price),
          marketData,
        }).toNumber() * Number(watchSize);

      takerWeight = 1;
    }

    if (side === "buy" && Number(watchPrice) > lowestAsk.price) {
      takerWeight = 1;
    }
    const sizeApplyFee = Number(totalSize) * takerWeight;
    return `${Number(
      ((sizeApplyFee * 1) / takerFeeDivisor).toFixed(marketData.base.decimals),
    )}`;
  }, [takerFeeDivisor, watchPrice, watchSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async ({ price, size }: LimitFormValues) => {
    if (marketData.base == null) {
      throw new Error("Markets without base coin not supported");
    }

    if (
      !balance ||
      balance.quote_available === null ||
      balance.base_available === null
    ) {
      throw new Error("Could not read wallet balances");
    }
    let rawSize = toRawCoinAmount(size, marketData.base.decimals);
    // check that size satisfies lot sizes
    if (!rawSize.modulo(marketData.lot_size).eq(0)) {
      rawSize = rawSize.minus(rawSize.modulo(marketData.lot_size));
      setTimeout(() => {
        setValue(
          "size",
          `${new BigNumber(rawSize)
            .div(10 ** marketData.base.decimals)
            .toNumber()}`,
        );
      }, 0);
    }

    if (rawSize.lt(marketData.min_size)) {
      setError("size", { message: "SIZE TOO SMALL" });
      return;
    }

    let rawPrice = fromDecimalPrice({
      price: Number(price),
      lotSize: marketData.lot_size,
      tickSize: marketData.tick_size,
      baseCoinDecimals: marketData.base.decimals,
      quoteCoinDecimals: marketData.quote.decimals,
    });

    if (!rawPrice.modulo(marketData.tick_size).eq(0)) {
      rawPrice = rawPrice.minus(rawPrice.modulo(marketData.tick_size));
      setValue("price", `${toDecimalPrice({ price: rawPrice, marketData })}`);
    }

    const rawBaseBalance = toRawCoinAmount(
      balance.base_available,
      marketData.base.decimals,
    );

    const rawQuoteBalance = toRawCoinAmount(
      balance.quote_available,
      marketData.quote.decimals,
    );
    if (
      (side === "buy" &&
        rawQuoteBalance.lt(
          rawSize
            .times(toRawCoinAmount(Number(price), marketData.quote.decimals))
            .div(new BigNumber(10).pow(marketData.base.decimals)),
        )) ||
      (side === "sell" && rawBaseBalance.lt(rawSize))
    ) {
      setError("size", { message: "INSUFFICIENT BALANCE" });
      return;
    }

    const orderSideMap: Record<Side, order.Side> = {
      buy: "bid",
      sell: "ask",
    };
    const orderSide = orderSideMap[side];

    const payload = entryFunctions.placeLimitOrderUserEntry(
      ECONIA_ADDR,
      TypeTag.fromApiCoin(marketData.base).toString(),
      TypeTag.fromApiCoin(marketData.quote).toString(),
      BigInt(marketData.market_id),
      INTEGRATOR_ADDRESS,
      orderSide,
      BigInt(rawSize.div(marketData.lot_size).toString()),
      BigInt(rawPrice.div(marketData.tick_size).toString()),
      "noRestriction",
      "abort",
    );
    // await signAndSubmitTransaction({ data: payload });
  };

  const isSufficient = useMemo(() => {
    if (!Number(watchSize)) {
      return true;
    }
    if (
      (side === "buy" && !balance?.quote_available) ||
      (side === "sell" && !balance?.base_available)
    ) {
      return false;
    }
    if (side === "buy") {
      return (
        Number(watchPrice) * Number(watchSize) <=
        Number(balance?.quote_available)
      );
    }

    if (side === "sell") {
      return Number(watchSize) <= Number(balance?.base_available);
    }
  }, [balance, watchSize, watchPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (side === "buy") {
      if (!balance?.quote_available || !Number(watchPrice)) {
        return;
      }
      const maxSize = balance?.quote_available / Number(watchPrice);
      setValue(
        "size",
        formatDecimal(Number((percent / 100) * maxSize), baseDecimalPlace),
      );
    }
    if (side === "sell") {
      if (!balance?.base_available) {
        return;
      }
      setValue(
        "size",
        formatDecimal(
          Number((balance.base_available * percent) / 100),
          baseDecimalPlace,
        ),
      );
    }
  }, [percent, balance, side, watchPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!Number(watchPrice) || !Number(watchSize)) {
      setSTotalSize("");
      return;
    }
    const total = Number(watchSize) * Number(watchPrice);
    setSTotalSize(total);
  }, [watchSize, watchPrice, side]); // eslint-disable-line react-hooks/exhaustive-deps
  const baseDecimalPlace = Math.round(
    Math.log(10 ** marketData.base.decimals / marketData.lot_size) /
      Math.log(10),
  );

  const setSTotalSize = (value: number | string) => {
    const quoteDecimalPlace = Math.round(
      Math.log(
        1 /
          (marketData.tick_size /
            10 ** marketData.quote.decimals /
            (marketData.lot_size / 10 ** marketData.base.decimals)),
      ) / Math.log(10),
    );
    const v = value ? Number(Number(value).toFixed(quoteDecimalPlace)) : value;
    setValue("totalSize", `${v}`);
  };

  return (
    <form>
      <div className="mt-4 flex h-full max-h-full flex-1 flex-col justify-between md:mx-4">
        <div className="flex flex-col gap-4 font-medium">
          <div className="flex items-center justify-between font-roboto-mono">
            <div className="text-xs font-medium text-graySecondary">
              Available to trade
            </div>
            <div className="text-xs text-white">0,00 ETH</div>
          </div>

          <div className="flex items-center justify-between font-roboto-mono">
            <div className="text-xs text-graySecondary ">Current Position</div>
            <div className="text-xs text-white">0,00 ETH</div>
          </div>

          {tab === "Limit" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 font-roboto-mono">
                <div className="whitespace-nowrap text-xs text-graySecondary">
                  Price USD
                </div>
                <div className="text-xs text-white">
                  <MarketInput
                    className="max-w-[170px]"
                    onChange={(price) => setPrice(price)}
                    rightText="Mid"
                    value={price}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 font-roboto-mono">
                <div className="whitespace-nowrap text-xs text-graySecondary">
                  Size
                </div>
                <div className="text-xs text-white">
                  <MarketInput
                    className="max-w-[170px]"
                    onChange={(size) => setSize(size)}
                    rightText={sizeSelect}
                    value={size}
                    selectOptions={["ETH", "BTC", "USDT", "BNB", "SOL"]}
                    onSelectChange={(sizeSelect) => setSizeSelect(sizeSelect)}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "Market" && (
            <div className="flex items-center justify-between font-roboto-mono">
              <div className="text-xs text-graySecondary">Size</div>
              <div className="flex items-center gap-1">
                <div className="text-xs text-white">0,00000 ETH</div>
                <div className="h-[18px] w-[1px] bg-greenSecondary" />
                <div className="text-xs text-graySecondary">0,00 ETH</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between font-roboto-mono">
            <div className="relative h-[20px] w-[180px] rounded-md bg-greenTertiary p-0.5">
              <div className="h-full w-[22px] rounded-md bg-greenPrimary" />
              <div className="absolute top-[5px] flex items-center">
                <div className="ml-[10px] h-[10px] w-[1px] bg-greenSecondary" />
                <div className="ml-8 h-[10px] w-[1px] bg-greenSecondary" />
                <div className="ml-8 h-[10px] w-[1px] bg-greenSecondary" />
                <div className="ml-8 h-[10px] w-[1px] bg-greenSecondary" />
                <div className="ml-8 h-[10px] w-[1px] bg-greenSecondary" />
              </div>
            </div>
            <div className="text-xs text-white">0%</div>
          </div>

          <div
            className={`flex flex-col gap-2 ${
              tab === "Limit" ? "visible" : "invisible"
            }`}
          >
            <div className="flex items-center gap-1.5 font-roboto-mono">
              <Checkbox id="reduce" checked={isReduce} onChange={setIsReduce} />
              <div className="select-none text-xs font-medium text-graySecondary">
                <label htmlFor="reduce">Reduce Only</label>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-roboto-mono">
              <Checkbox id="profit" checked={isProfit} onChange={setIsProfit} />
              <div className="select-none text-xs font-medium text-graySecondary">
                <label htmlFor="profit">Take Profit / Stop Loss</label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 w-full">
          <Button className="w-full" variant="secondary">
            Enable trading
          </Button>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between font-roboto-mono">
              <div className="text-xs text-graySecondary">
                Liquidation price
              </div>
              <div className="text-xs text-white">N/A</div>
            </div>

            <div className="flex items-center justify-between font-roboto-mono">
              <div className="text-xs text-graySecondary">Order Value</div>
              <div className="text-xs text-white">N/A</div>
            </div>

            <div className="flex items-center justify-between font-roboto-mono">
              <div className="text-xs text-graySecondary">Margin Required</div>
              <div className="text-xs text-white">N/A</div>
            </div>

            {tab === "Limit" && (
              <div className="flex items-center justify-between font-roboto-mono">
                <div className="text-xs text-graySecondary">Slippage</div>
                <div className="text-xs text-greenPrimary">
                  Est.0% / Max: 8.00%
                </div>
              </div>
            )}

            <div className="flex items-center justify-between font-roboto-mono">
              <div className="text-xs text-graySecondary">Fees</div>
              <div className="text-xs text-white">0.0450% / 0.0150%</div>
            </div>

            {tab === "Limit" && (
              <>
                <Button className="w-full" variant="secondary">
                  Deposit
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="flex w-full items-center gap-0.5 bg-transparent !px-3 !py-1 text-sm"
                    variant="secondary"
                  >
                    Perps <PerpsSpotIcon /> Spot
                  </Button>
                  <Button
                    className="w-full bg-transparent !py-1 text-sm"
                    variant="secondary"
                  >
                    Withdraw
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

const PerpsSpotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M10.6667 2L13.3334 4.66667M13.3334 4.66667L10.6667 7.33333M13.3334 4.66667H2.66675M5.33341 14L2.66675 11.3333M2.66675 11.3333L5.33341 8.66667M2.66675 11.3333H13.3334"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
