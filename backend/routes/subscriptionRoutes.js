const express    = require('express');
const router     = express.Router();
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/auth');
const { buildPaymentPayload, decryptCallbackData } = require('../utils/airpayservice');

// Your Render deployment URL — AirPay posts the callback here
const BACKEND_URL = process.env.BACKEND_URL
  || 'https://build-track.onrender.com';

const PLAN_PRICES = {
  starter:    498,
  growth:     999,
  pro:       1499,
  business:  2499,
  enterprise: 4999,
};

const PLAN_DURATION_DAYS = {
  starter:    30,
  growth:     30,
  pro:        30,
  business:   30,
  enterprise: 30,
};

// =================================================================
// POST /api/subscriptions/initiate
// =================================================================
router.post('/initiate', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId   = req.user._id;

    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const orderId = `BT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const amount  = PLAN_PRICES[plan];

    await Subscription.create({
      userId,
      plan,
      status: 'pending',
      amount,
      airpayOrderId: orderId,
    });

    const user = req.user;
    const nameParts = (user.name || 'BuildTrack User').split(' ');

    const { postUrl, formFields } = await buildPaymentPayload({
      orderId,
      amount,
      buyerEmail:     user.email     || 'test@buildtrack.com',
      buyerPhone:     user.phone     || '9999999999',
      buyerFirstName: nameParts[0]   || 'BuildTrack',
      buyerLastName:  nameParts.slice(1).join(' ') || 'User',
      returnUrl:      `${BACKEND_URL}/api/subscriptions/callback`,
    });

    res.json({
      success: true,
      paymentParams: {
        airpayUrl: postUrl,
        ...formFields,
      },
      orderId,
    });
  } catch (err) {
    console.error('Initiate error:', err.message);
    res.status(500).json({
      message: 'Failed to initiate payment',
      detail:  err.message,
    });
  }
});

// =================================================================
// POST /api/subscriptions/callback
// AirPay posts here — no auth middleware
// =================================================================
router.post('/callback', async (req, res) => {
  try {
    console.log('AirPay callback raw body:', JSON.stringify(req.body));

    let result = req.body;
    if (req.body.response) {
      result = decryptCallbackData(req.body.response);
      console.log('AirPay callback decrypted:', JSON.stringify(result));
    }

    const dataObj = result.data || result;

    const orderid       = dataObj.orderid || dataObj.order_id || result.orderid;
    const transactionId = dataObj.ap_transactionid || dataObj.transactionid || dataObj.transaction_id || result.transactionid;
    const paymentStatus = (
      dataObj.transaction_status ||
      dataObj.transaction_payment_status ||
      dataObj.payment_status ||
      result.status ||
      ''
    ).toString().toUpperCase();

    const sub = await Subscription.findOne({ airpayOrderId: orderid });
    if (!sub) {
      console.error('No matching subscription for orderid:', orderid);
      return res.redirect('buildtrack://payment/failure?reason=order_not_found');
    }

    if (paymentStatus === 'SUCCESS' || paymentStatus === '200') {
      const now     = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (PLAN_DURATION_DAYS[sub.plan] || 30));

      await Subscription.findByIdAndUpdate(sub._id, {
        status: 'active',
        transactionId,
        startDate: now,
        endDate,
      });

      return res.redirect(
        `buildtrack://payment/success?plan=${sub.plan}&txn=${transactionId}`
      );
    } else {
      await Subscription.findByIdAndUpdate(sub._id, {
        status: 'failed',
        transactionId,
      });
      return res.redirect('buildtrack://payment/failure?reason=payment_failed');
    }
  } catch (err) {
    console.error('Callback error:', err.message);
    res.redirect('buildtrack://payment/failure?reason=server_error');
  }
});

// =================================================================
// GET /api/subscriptions/status
// Admins check their own subscription. Provisioned users (Supervisor,
// Mason, custom roles, etc.) have no Subscription of their own — they
// inherit whatever plan the Admin who created them is on.
// =================================================================
router.get('/status', protect, async (req, res) => {
  try {
    const isAdmin = (req.user.role || '').toLowerCase() === 'admin';
    const billingUserId = isAdmin
      ? req.user._id
      : (req.user.createdBy || req.user._id);

    const sub = await Subscription.findOne({
      userId:  billingUserId,
      status:  'active',
      endDate: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!sub) return res.json({ hasSubscription: false, plan: null });

    res.json({
      hasSubscription: true,
      plan:          sub.plan,
      status:        sub.status,
      startDate:     sub.startDate,
      endDate:       sub.endDate,
      transactionId: sub.transactionId,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch status' });
  }
});

module.exports = router;