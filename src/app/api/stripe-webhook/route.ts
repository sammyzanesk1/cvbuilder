import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { env } from "@/env";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import { revalidatePath } from "next/cache";

/**
 * STRIPE WEBHOOK HANDLER
 * This is a "Post Office" for your app. Stripe sends messages (events) here
 * to tell your app when someone pays, cancels, or updates their subscription.
 */

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text(); // Capture the raw data stream sent by/from stripe server to this webhook as the exact string (not a JSON req object) -to keep the signature valid.

    const signature = req.headers.get("stripe-signature");

    console.log(signature);

    //guard clause for unauthorized sender...request is not from stripe webhook endpoint..Immediate exit if the stripe-signature header is missing
    if (!signature) {
      return new Response("signature is missing", { status: 400 });
    }

    //construct the event object using stripe's details..converts the raw payload from stripe's endpoint into a validated Stripe Event
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    console.log(`Received event: ${event.type}`, event.data.object);

    //handling the event stripe endpoint is sending, default handles any event that is not among the 4 specified when we configured the webhook in stripe
    switch (event.type) {
      case "checkout.session.completed":
        await handleSessionCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionCreatedOrUpdated(event.data.object.id);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`{unhandled event type: ${event.type}`);
        break;
    }

    return new Response("Event received", { status: 200 }); //always return a success object response where the route file has completed the handshake, this prevents stripe endpoint from trying to resend the Post request
  } catch (error) {
    console.error(error);
    return new Response("Internal server Error", { status: 500 });
  }
}

async function handleSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    throw new Error("User ID is missing in stripe session metadata");
  }

  /**
   * REPAIR & SYNC: This function is the "Final Handshake" that links Stripe to Clerk.
   *
   * 1. FIRST TIME: If a user is new, Stripe creates their first ID (e.g., 'cus_111').
   *    We save this to Clerk so we can remember them later.
   *
   * 2. RECURRING: Normally, Stripe keeps using the SAME ID for a user. Our code
   *    simply "re-saves" that same ID to Clerk to confirm the connection is still solid.
   *
   * 3. BROKEN SYNC (The "Fix"): If you manually deleted a user in Stripe, our app
   *    detects the error and forces Stripe to create a BRAND NEW ID (e.g., 'cus_999').
   *    This line then "overwrites" the old, broken ID in Clerk with the new working one.
   */

  (await clerkClient()).users.updateUserMetadata(userId, {
    privateMetadata: {
      stripeCustomerId: session.customer as string,
    },
  });
}

/**
 * DATABASE SYNC: Keeps your Neon Database (Prisma) updated with the current plan.
 */

async function handleSubscriptionCreatedOrUpdated(subscriptionId: string) {
  console.log("handleSubscriptionCreatedOrUpdated");

  //1. Get the full details of the subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // If the user's plan is active or still in trial....successful subscription case 2
  if (
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "past_due"
  ) {
    // "Upsert" means: If the user subscription record doesn't exist, Create it using users stripe details. If it does, Update the users prisma db stripe subscription details using the users incoming stripe subscription plan event object sent by stripe endpoint...
    await prisma.userSubscription.upsert({
      where: {
        userId: subscription.metadata.userId,
      },
      create: {
        userId: subscription.metadata.userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ),
        stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ),
        stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } else {
    // If the payment failed or a customer cancels a subscription, remove the premium subscription from your database....not completed or failed or canceled stripe subscription should be deleted
    await prisma.userSubscription.deleteMany({
      where: { stripeCustomerId: subscription.customer as string },
    });
  }
  revalidatePath("/billing");
}

/**
 * CLEANUP: Removes subscription records from your database when they are deleted in Stripe.
 */

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.userSubscription.deleteMany({
    where: { stripeCustomerId: subscription.customer as string },
  });
  console.log("handleSubscriptionDeleted");

  revalidatePath("/billing");
}
