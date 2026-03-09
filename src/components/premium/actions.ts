"use server";

import { env } from "@/env";
import stripe from "@/lib/stripe";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

/**
 * Starts the Stripe payment process.
 * It checks Clerk for a Customer ID and sends the user to the Stripe Checkout page.
 */

export async function createCheckoutSession(priceId: string) {
  const user = await currentUser();

  const client = await clerkClient();

  if (!user) {
    throw new Error("Unauthorized");
  }

  /**
   * RECURRING USER CHECK:
   * We attempt to retrieve the stripeCustomerId from Clerk's private metadata.
   * If this user has paid before and everything is in sync, this will be a 'cus_...' string
   * other wise stripeCustomerId property will not exists in clerk as the customer has not subscribed before
   * user.privateMetadata.stripeCustomerId breaks to undefined
   */
  let stripeCustomerId = user.privateMetadata.stripeCustomerId as
    | string
    | undefined;

  console.log(stripeCustomerId);

  //safeguard to crosscheck stripe id we got from clerk against the stripe id that exists in stripe..if they are not the same for any reason, error 404 is returned by stripe, we reset stripeId to be undefined and a new custome is created again by stripe
  if (stripeCustomerId) {
    try {
      // We "ping" Stripe to see if user's clerk ID exists in Stripe's system or if they are the same...

      const customerObjectFromStripe =
        await stripe.customers.retrieve(stripeCustomerId); //returns the user's or customer object [active customer || deleted customer]

      console.log(
        customerObjectFromStripe.id,
        customerObjectFromStripe.deleted,
        customerObjectFromStripe.id === stripeCustomerId,
      );

      /**
       * SOFT DELETE: Handles cases where the customer was deleted via the Stripe API (e.g., a "Cancel Account" button in your app).
       * Stripe keeps the customer object in its records but marks the object as 'deleted: true'.
       */
      if (
        "deleted" in customerObjectFromStripe &&
        customerObjectFromStripe.deleted
      ) {
        //in the case of soft delete, we need to overwrite the clerk user/customer Id to null since the user has been deleted from stripe record, then set it to undefine so stripe can assign a new customer Id.
        await client.users.updateUserMetadata(user.id, {
          privateMetadata: { stripeCustomerId: null },
        });
        stripeCustomerId = undefined;
      }
    } catch (error: unknown) {
      console.log(error);
      // We 'cast' the error to a generic object to check its properties safely..error will be an object with value of string, we manually set the type of the error to this.
      const stripeError = error as { statusCode?: number };

      //if the error from stripe is the user/customer id does not exist in stripe records itself ie 404 not found, we delete the clerk user/customer invalid id by setting it to null
      if (stripeError.statusCode === 404) {
        await client.users.updateUserMetadata(user.id, {
          privateMetadata: { stripeCustomerId: null },
        });
        stripeCustomerId = undefined;
      }
    }
  }

  //an error will occur if user is deleted, ie invalid customer id...we create a session that activates Stripe session and checkout page using success url we set
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${env.NEXT_PUBLIC_BASE_URL}/billing/success`,
    cancel_url: `${env.NEXT_PUBLIC_BASE_URL}/billing`,

    /**
     * ACCOUNT LINKING LOGIC:
     * 1. If stripeCustomerId exists: Stripe attaches this session to the existing customer.
     * 2. If stripeCustomerId is undefined: Stripe will create a BRAND NEW customer
     *    record upon successful payment.
     */
    customer: stripeCustomerId,

    /**
     * NEW CUSTOMER INITIALIZATION:
     * Stripe does not allow both 'customer' and 'customer_email' simultaneously.
     * - If we have a customer ID, we pass 'undefined' for email (Stripe already knows it).
     * - If we DON'T have an ID (first-time checkout), we pass the Clerk email.
     *   Stripe will then use this email to create the new account.
     */
    customer_email: stripeCustomerId
      ? undefined
      : user.emailAddresses[0].emailAddress,

    metadata: {
      userId: user.id, // Important: This links the Stripe event back to your Clerk User ID in webhooks...metadata attached to the stripe session
    },

    subscription_data: {
      metadata: {
        userId: user.id, //metadata attached to stripe subscription event
      },
    },

    custom_text: {
      terms_of_service_acceptance: {
        message: `I have read Resume Builder's [terms of service](${env.NEXT_PUBLIC_BASE_URL}/tos) and agree to them`,
      },
    },

    consent_collection: { terms_of_service: "required" },
  });

  //after creating the session either we will be redirected to a success page if we subscribe or to the previous billing page if we do not, or the attempt to create the session will fail in that case throw the error below

  if (!session.url) {
    throw new Error("failed to create checkout session");
  }

  return session.url;
}
