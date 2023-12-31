require("dotenv").config();
const User = require('../models/userModel')

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const YOUR_DOMAIN = process.env.FRONTEND_URL;



exports.createSubscription = async (req, res) => {

  const prices = await stripe.prices.list({
    lookup_keys: [req.body.lookup_key],
    expand: ['data.product'],
  });
  const session = await stripe.checkout.sessions.create({
    billing_address_collection: 'auto',
    line_items: [
      {
        price: prices.data[0].id,
        // For metered billing, do not pass quantity
        quantity: 1,

      },
    ],
    mode: 'subscription',
    success_url: `${YOUR_DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
  });

  res.redirect(303, session.url);

};


exports.portalSession = async (req, res) => {
  const { session_id } = req.body;
  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = `${YOUR_DOMAIN}/success`;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: checkoutSession.customer,
    return_url: returnUrl,
  });

  res.redirect(303, portalSession.url);
}



exports.handleWebhooks = (request, response) => {
  const endpointSecret = process.env.STRIPE_SECRET_KEY;
  const signature = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, signature, endpointSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return response.sendStatus(400);
  }

  let subscription;
  let status;

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.trial_will_end':
      subscription = event.data.object;
      status = subscription.status;
      // Define and call a method to handle the trial ending.
      handleSubscriptionTrialEnding(subscription);
      break;
    case 'customer.subscription.deleted':
      subscription = event.data.object;
      status = subscription.status;
      // Define and call a method to handle the subscription deleted.
      handleSubscriptionDeleted(subscription);
      break;
    case 'customer.subscription.created':
      subscription = event.data.object;
      status = subscription.status;
      // Define and call a method to handle the subscription created.
      handleSubscriptionCreated(subscription);
      break;
    case 'customer.subscription.updated':
      subscription = event.data.object;
      status = subscription.status;
      // Define and call a method to handle the subscription update.
      handleSubscriptionUpdated(subscription);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
};
