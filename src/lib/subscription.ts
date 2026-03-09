import { env } from "@/env";
import prisma from "./prisma";
import { cache } from "react";

export type SubscriptionLevel = "free" | "pro" | "pro_plus"; //type definition for the return value of calling this function getUserSubscriptionLevel

//cache handles multiple calls to the same db endpoint from different files (same ui or page)  so that only one request is sent
//fetching user subscription plan
export const getUserSubscriptionLevel = cache(
  async (userId: string): Promise<SubscriptionLevel> => {
    const subscription = await prisma.userSubscription.findUnique({
      where: {
        userId,
      },
    });

    console.log(subscription);

    //no sub plan has ever been done before till present, or a plan was done before but has expired/no longer active
    if (!subscription || subscription.stripeCurrentPeriodEnd < new Date()) {
      return "free";
    }

    //sub exist but it is pro plan...
    if (
      subscription.stripePriceId === env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY
    ) {
      return "pro";
    }

    //pro_plus plan exist
    if (
      subscription.stripePriceId ===
      env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_PLUS_MONTHLY
    ) {
      return "pro_plus";
    }

    //stripe price ID in users prisma db is not same as price id in his stripe account..that is an error
    throw new Error("Invalid subscription");
  },
);
