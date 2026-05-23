import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getPriceId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const plan = request.nextUrl.searchParams.get("plan") as
      | "pro"
      | "expert"
      | null;
    if (plan !== "pro" && plan !== "expert") {
      return NextResponse.redirect(new URL("/pricing", request.url));
    }

    const priceId = getPriceId(plan);
    if (!priceId) {
      console.error(`Missing price ID for plan: ${plan}`);
      return NextResponse.redirect(
        new URL("/pricing?error=config", request.url)
      );
    }

    // Check if user already has an active subscription → send to portal instead
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (subscription?.stripe_subscription_id) {
      return NextResponse.redirect(
        new URL("/api/stripe/portal", request.url)
      );
    }

    const origin =
      request.headers.get("origin") ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: subscription?.stripe_customer_id || undefined,
      customer_email: subscription?.stripe_customer_id
        ? undefined
        : user.email!,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success`,
      cancel_url: `${origin}/pricing?canceled=true`,
    });

    return NextResponse.redirect(session.url!);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/checkout] Error:", message);
    const url = new URL("/pricing", request.url);
    url.searchParams.set("error", "stripe");
    url.searchParams.set("details", message);
    return NextResponse.redirect(url);
  }
}
