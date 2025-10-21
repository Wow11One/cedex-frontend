import React, { useState } from "react";

import { BaseModal } from "@/components/modals/BaseModal";
import { type ApiMarket } from "@/types/api";

import { OrderEntry } from "../OrderEntry";
import { Button } from "@/components/Button";

const MobileOrderEntry = ({
  marketData,
  onDepositWithdrawClick,
}: {
  marketData: ApiMarket;
  onDepositWithdrawClick: () => void;
}) => {
  const [modal, setModal] = useState<{
    side: "buy" | "sell";
    isOpen: boolean;
  }>({
    side: "buy",
    isOpen: false,
  });

  const openModal = (side: "buy" | "sell") => () => {
    setModal({
      isOpen: true,
      side: side,
    });
  };

  const closeModal = () => {
    setModal({
      ...modal,
      isOpen: false,
    });
  };
  return (
    <div className=" md:hidden">
      <div className="fixed bottom-0 left-0 z-[25] flex w-full gap-6 bg-fade px-6 py-4">
        <Button
          variant="secondary"
          onClick={openModal("buy")}
          className="w-full"
        >
          Buy/Sell
        </Button>
      </div>

      <div className="">
        <BaseModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          className="w-full max-w-[284px] !p-3 "
        >
          <OrderEntry
            onDepositWithdrawClick={onDepositWithdrawClick}
            defaultSide={modal.side}
            marketData={marketData}
          />
        </BaseModal>
      </div>
    </div>
  );
};

export default MobileOrderEntry;
