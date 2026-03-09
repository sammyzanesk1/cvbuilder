"use client";

import { SubscriptionLevel } from "@/lib/subscription";
import { createContext, useContext, type ReactNode } from "react";

const SubscriptionLevelContext = createContext<SubscriptionLevel | undefined>(
  undefined,
);

interface SubscriptionLevelProviderProps {
  children: ReactNode;
  userSubscriptionLevel: SubscriptionLevel;
}

function SubscriptionLevelProvider({
  children,
  userSubscriptionLevel,
}: SubscriptionLevelProviderProps) {
  return (
    <SubscriptionLevelContext.Provider value={userSubscriptionLevel}>
      {children}
    </SubscriptionLevelContext.Provider>
  );
}
export default SubscriptionLevelProvider;

//function that provides the sub level value
export function useSubscriptionLevel() {
  const context = useContext(SubscriptionLevelContext);

  if (context === undefined) {
    throw new Error(
      "useSubscriptionLevel is used only within SubscriptionLevelProvider tree, it is being used right now outside of context tree",
    );
  }

  return context;
}
