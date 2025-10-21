import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { type PropsWithChildren } from "react";

import { useConnectWallet } from "@/contexts/ConnectWalletContext";

import { Button } from "./Button";
import { SmallWalletIcon } from "./icons/SmallWalletIcon";

export const ConnectedButton: React.FC<
  PropsWithChildren<{ className?: string }>
> = ({ className, children }) => {
  const { connected } = useWallet();
  const { connectWallet } = useConnectWallet();

  return (
    <>
      {!connected ? (
        <Button
          className={` !leading-[22px] tracking-[0.32px] ${className}`}
          variant="outlined"
          onClick={(e) => {
            e.preventDefault();
            connectWallet();
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <SmallWalletIcon className="h-4 w-4" />
            <div className="whitespace-nowrap">Connect wallet</div>
          </div>
        </Button>
      ) : (
        children
      )}
    </>
  );
};
