import Stripe from "stripe";
import getDbConnection from "./db";

type User = {
  email: string;
  full_name: string;
  customer_id: string;
  price_id?: string;
  status?: string;
};

type Sql = {
  <T = unknown>(query: TemplateStringsArray, ...args: unknown[]): Promise<T>;
};

export async function handleSubscriptionDeleted({
  subscriptionId,
  stripe,
}: {
  subscriptionId: string;
  stripe: Stripe;
}) {
  try {
    const sql: Sql = await getDbConnection();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await sql`UPDATE users SET status = 'cancelled' WHERE customer_id = ${subscription.customer}`;
  } catch (error) {
    console.error("Error handling subscription deletion", error);
    throw error;
  }
}

export async function handleCheckoutSessionCompleted({
  session,
  stripe,
}: {
  session: Stripe.Checkout.Session;
  stripe: Stripe;
}) {
  const customerId = session.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const priceId = session.line_items?.data[0].price?.id;

  const sql: Sql = await getDbConnection();

  if ("email" in customer && priceId) {
    await createOrUpdateUser(sql, customer, customerId);
    await updateUserSubscription(sql, priceId, customer.email as string);
    await insertPayment(sql, session, priceId, customer.email as string);
  }
}

async function insertPayment(
  sql: Sql,
  session: Stripe.Checkout.Session,
  priceId: string,
  customerEmail: string
) {
  try {
    await sql`INSERT INTO payments (amount, status, stripe_payment_id, price_id, user_email) VALUES (${session.amount_total}, ${session.status}, ${session.id}, ${priceId}, ${customerEmail})`;
  } catch (err) {
    console.error("Error in inserting payment", err);
  }
}

async function createOrUpdateUser(
  sql: Sql,
  customer: Stripe.Customer,
  customerId: string
) {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email = ${customer.email}`;
    
    if (user.length === 0) {
      await sql`INSERT INTO users (email, full_name, customer_id) VALUES (${customer.email}, ${customer.name}, ${customerId})`;
    }
  } catch (err) {
    console.error("Error in inserting user", err);
  }
}

async function updateUserSubscription(
  sql: Sql,
  priceId: string,
  email: string
) {
  try {
    await sql`UPDATE users SET price_id = ${priceId}, status = 'active' WHERE email = ${email}`;
  } catch (err) {
    console.error("Error in updating user", err);
  }
}
