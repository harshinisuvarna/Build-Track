const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { generateChecksum } = require('../utils/airpayChecksum');
const { protect } = require('../middleware/auth');

// ── AirPay sandbox credentials ────────────────────────────────────
// TODO: Replace with real values from your teammate
const AIRPAY_MERCHANT_ID = process.env.AIRPAY_MERCHANT_ID;
const AIRPAY_SECRET_KEY  = process.env.AIRPAY_SECRET_KEY;
const AIRPAY_USERNAME    = process.env.AIRPAY_USERNAME;
const AIRPAY_PASSWORD    = process.env.AIRPAY_PASSWORD;
const AIRPAY_CLIENT_ID   = process.env.AIRPAY_CLIENT_ID;  // for future use
const AIRPAY_API_KEY     = process.env.AIRPAY_API_KEY;    // for future use
const BACKEND_URL        = process.env.BACKEND_URL;

// AirPay sandbox payment page URL
const AIRPAY_SANDBOX_URL = 'https://payments.airpay.co.in/pay/index.php';

// ── Plan prices in INR paise (amount × 100) ───────────────────────
const PLAN_PRICES = {
  starter:    49800,   // ₹498
  growth:     99900,   // ₹999
  pro:        149900,  // ₹1499
  business:   249900,  // ₹2499
  enterprise: 499900,  // ₹4999
};

// ── Plan durations in days ────────────────────────────────────────
const PLAN_DURATION_DAYS = {
  starter:    30,
  growth:     30,
  pro:        30,
  business:   30,
  enterprise: 30,
};

// =================================================================
// POST /api/subscriptions/initiate
// Flutter calls this to get all AirPay payment params
// =================================================================
router.post('/initiate', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user._id;

    // Validate plan
    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Generate a unique order ID
    const orderId  = `BT_${userId}_${Date.now()}`;
    const amount   = (PLAN_PRICES[plan] / 100).toFixed(2); // e.g. "498.00"
    const currency = '356'; // INR ISO 4217 numeric code

    // Save pending subscription to DB first
    const sub = await Subscription.create({
      userId,
      plan,
      status:        'pending',
      amount:        PLAN_PRICES[plan] / 100,
      airpayOrderId: orderId,
    });

    const user = req.user;

    // Build checksum — field order matters, must match AirPay docs exactly
    const checksumFields = [
      AIRPAY_MERCHANT_ID,
      orderId,
      amount,
      currency,
      'DIRECT',                          // itemcode — always DIRECT
      user.email || 'test@test.com',
    ];
    const checksum = generateChecksum(AIRPAY_SECRET_KEY, checksumFields);

    // Return all params Flutter needs to build the payment form
    res.json({
      success: true,
      paymentParams: {
        merchantid:    AIRPAY_MERCHANT_ID,
        username:      AIRPAY_USERNAME,
        password:      AIRPAY_PASSWORD,
        orderid:       orderId,
        amount:        amount,
        currency:      currency,
        itemcode:      'DIRECT',
        customeremail: user.email   || 'test@test.com',
        customerphone: user.phone   || '9999999999',
        customername:  user.name    || 'BuildTrack User',
        checksum:      checksum,
        returnurl:     `${BACKEND_URL}/api/subscriptions/callback`,
        airpayUrl:     AIRPAY_SANDBOX_URL,
      },
      subscriptionId: sub._id,
    });
  } catch (err) {
    console.error('Initiate error:', err);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
});

// =================================================================
// POST /api/subscriptions/callback
// AirPay posts here after payment — NO protect middleware here
// =================================================================
router.post('/callback', async (req, res) => {
  try {
    const {
      orderid,
      transactionid,
      status,   // 'SUCCESS' or 'FAILURE'
    } = req.body;

    console.log('AirPay callback received:', req.body);

    const sub = await Subscription.findOne({ airpayOrderId: orderid });
    if (!sub) {
      console.error('Callback: order not found:', orderid);
      return res.redirect('buildtrack://payment/failure?reason=order_not_found');
    }

    if (status === 'SUCCESS') {
      const now     = new Date();
      const days    = PLAN_DURATION_DAYS[sub.plan] || 30;
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + days);

      await Subscription.findByIdAndUpdate(sub._id, {
        status:        'active',
        transactionId: transactionid,
        startDate:     now,
        endDate:       endDate,
      });

      console.log(`Subscription activated: ${sub.plan} for user ${sub.userId}`);

      return res.redirect(
        `buildtrack://payment/success?plan=${sub.plan}&txn=${transactionid}`
      );
    } else {
      await Subscription.findByIdAndUpdate(sub._id, {
        status:        'failed',
        transactionId: transactionid,
      });

      console.log(`Payment failed for order: ${orderid}`);

      return res.redirect(
        'buildtrack://payment/failure?reason=payment_failed'
      );
    }
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('buildtrack://payment/failure?reason=server_error');
  }
});

// =================================================================
// GET /api/subscriptions/status
// Flutter calls this to check current active subscription
// =================================================================
router.get('/status', protect, async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
      endDate: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!sub) {
      return res.json({ hasSubscription: false, plan: null });
    }

    res.json({
      hasSubscription: true,
      plan:          sub.plan,
      status:        sub.status,
      startDate:     sub.startDate,
      endDate:       sub.endDate,
      transactionId: sub.transactionId,
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ message: 'Failed to fetch status' });
  }
});

module.exports = router;