import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import type Stripe from "stripe";
import GetSubscriptionButton from "./GetSubscriptionButton";
import { formatDate } from "date-fns";
import ManageSubscriptionButton from "./ManageSubscriptionButton";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function Page() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    // This automatically handles the "return to /billing" logic for you
    return redirectToSignIn({ returnBackUrl: "/billing" });
  }

  //fetch actual sub object from stripe stored in the prisma db...
  const subscription = await prisma.userSubscription.findUnique({
    where: {
      userId,
    },
  });

  console.log(subscription);

  const priceInfo = subscription
    ? await stripe.prices.retrieve(subscription.stripePriceId, {
        expand: ["product"],
      })
    : null;
  console.log(priceInfo);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-3 py-6">
      <h1 className="text-3xl font-bold">Billing</h1>
      <p>
        Your current Plan: {""}{" "}
        <span className="font-bold">
          {priceInfo ? (priceInfo.product as Stripe.Product).name : "Free"}
        </span>
      </p>

      {subscription ? (
        //user cancel an unexpired subscription plan
        <>
          {subscription.stripeCancelAtPeriodEnd && (
            <p className="text-destructive">
              Your subscription will be cancelled on{""}
              {formatDate(subscription.stripeCurrentPeriodEnd, "MMMM dd, yyyy")}
            </p>
          )}

          <ManageSubscriptionButton />
        </>
      ) : (
        //free plan
        <GetSubscriptionButton />
      )}
    </main>
  );
}
