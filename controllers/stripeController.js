require("dotenv").config();
const User = require('../models/userModel')
const moment = require('moment')

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)



const stripeSession = async (priceId) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    })
    return session;
  } catch(e){
    return Promise.reject(e);
  }
}

exports.createSubscription = async (req, res) => {

  const { tier, customerId } = req.body

  const authenticatedUserId = req.user._id; // the _id from the user document retrieved from the database
  
  if (customerId !== authenticatedUserId.toString()) {
      return res.status(403).json({ msg: 'Access forbidden' });
  }

  const priceId = tier.id;
  
  
  try {

    const session = await stripeSession(priceId)

    const user = await User.findByIdAndUpdate(customerId, { subscription: {
      sessionId: session.id
    } })
    console.log(session)
    return res.json({session})

  }catch(error){
    console.error(error)
    res.status(500).send('An error occurred while creating the subscription')
  }

};

exports.paymentSuccess = async (req, res) => {
  const {userId, sessionId} = req.body

  const authenticatedUserId = req.user._id; // the _id from the user document retrieved from the database
  
  if (userId !== authenticatedUserId.toString()) {
      return res.status(403).json({ msg: 'Access forbidden' });
  }

  try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)

      if (session.payment_status === 'paid') {
        const subscriptionId = session.subscription
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const planId = subscription.plan.id
          let planType = 'unsubscribed'
          
          
          if(subscription.plan.amount === 1499) planType = 'Silver Monthly';
          else if(subscription.plan.amount === 11988) planType = 'Silver Annual';
          else if (subscription.plan.amount === 1999) planType = 'Gold Monthly';
          else if (subscription.plan.amount === 17988) planType = 'Gold Annual';
          const startDate = moment.unix(subscription.current_period_start).format('YYYY-MM-DD')
          const endDate = moment.unix(subscription.current_period_end).format('YYYY-MM-DD')
          const durationInSeconds = subscription.current_period_end - subscription.current_period_start
          const durationInDays = moment.duration(durationInSeconds, 'seconds').asDays()

          let credits = 500;
          switch(planType) {
            case 'Silver Monthly':
              credits = 6000;
              break;
            case 'Silver Annual':
              credits = 72000;
              break
            case 'Gold Monthly':
              credits = 12000;
              break
            case 'Gold Annual':
              credits = 144000;
              break
            default:
              break
          }

          const user = await User.findByIdAndUpdate(userId, {
            subscription: {
              stripeSubscriptionId:  subscription.id,
              sessionId: null,
              planId: planId,
              planType: planType,
              planStartDate: startDate,
              planEndDate: endDate,
              planDuration: durationInDays,
            },
            credits: credits
          })
        } catch(error) {
          console.error('Error retrieving subscription', error)
          return res.status(500).send('An error occurred while retrieving the subscription');
        }
        return res.json({message: 'Payment Successful'})
      } else {
        return res.json({message: 'Payment Failed'})
      }
  } catch(error){
    console.error(error)
    res.status(500).send('Payment unsuccessful.')
  }
}


function getPlanType(amount) {
  if (amount === 0) return 'Bronze';
  if (amount === 1499) return 'Silver Monthly';
  if (amount === 11988) return 'Silver Annual';
  if (amount === 1999) return 'Gold Monthly';
  if (amount === 17988) return 'Gold Annual';
  return 'unknown';
}


exports.handleWebhooks = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle payment success
        break;
      case 'payment_intent.payment_failed':
        // Handle payment failure
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;
       

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({error: 'User not found'});
        }

        if (subscription.status === 'active') {
          // Update user subscription data
          user.subscription = {
              stripeSubscriptionId: subscription.id,
              planId: subscription.items.data[0].plan.id,
              planType: getPlanType(subscription.items.data[0].plan.amount),
              planStartDate: moment.unix(subscription.current_period_start).format('YYYY-MM-DD'),
              planEndDate: moment.unix(subscription.current_period_end).format('YYYY-MM-DD'),
              planDuration: moment.duration(subscription.current_period_end - subscription.current_period_start, 'seconds').asDays(),
          };
      } else {
          // Reset user subscription data
          user.subscription = { stripeSubscriptionId: subscription.id };
      }
  
      await user.save();


        break;
      // ... handle other event types
      default:
        return res.status(400).send({ error: 'Unhandled event type' });
    }
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(400).send({ error: 'Webhook Error: ' + error.message });
  }
};


// cancel subscription function

exports.deletedSubscription = async (req, res) => {

  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.subscription || !user.subscription.stripeSubscriptionId) {

      return res.status(404).json({ msg: 'Subscription not found' });
    }

    const deletedSubscription = await stripe.subscription.del(user.subscription.stripeSubscriptionId)

    user.subscription = {
      planType: 'unsubscribed',
      stripeSubscriptionId: null
    };
    
    await user.save();

    res.status(200).json({ msg: 'Subscription cancelled successfully'});

  } catch(error) {
    console.error('Error cancelling subscription', error);
    res.status(500).send('An error occurred while cancelling the subscription');
  }
  
}

