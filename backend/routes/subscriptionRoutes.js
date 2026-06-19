// ============================================================================
// AirPay subscription routes — rebuilt to match the official SDK's actual
// route structure (index.js), but organized to use airpayService.js /
// airpayCrypto.js instead of inlining crypto logic directly in the route.
//
// Flow:
//   POST /api/subscriptions/initiate  -> builds payment payload, returns
//                                         { mid, data, privatekey, checksum,
//                                           postUrl } for the frontend to
//                                         auto-submit as a form (mirrors the
//                                         SDK's sendtoairpay.pug behavior).
//   POST /api/subscriptions/callback  -> AirPay posts the encrypted
//                                         `response` field here after
//                                         payment; decrypt and update DB.
// ============================================================================
const express = require('express');
const router  = express.Router();
const { check } = require('express-validator');
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/auth');
const { buildPaymentPayload, decryptCallbackData } = require('../utils/airpayService');

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
      buyerEmail:     user.email   || 'test@buildtrack.com',
      buyerPhone:     user.phone   || '9999999999',
      buyerFirstName: nameParts[0] || 'BuildTrack',
      buyerLastName:  nameParts.slice(1).join(' ') || 'User',
    });

    // Mirrors the SDK's rendered template — frontend should auto-submit
    // these exact fields (mid, data, privatekey, checksum) as a POST
    // form to postUrl.
    res.json({
      success: true,
      postUrl,
      formFields,
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

    // Per the PDF's documented response fields (section C.2):
    //   TRANSACTIONID, APTRANSACTIONID, AMOUNT, TRANSACTIONSTATUS,
    //   MESSAGE, ap_SecureHash, CUSTOMVAR
    // The decrypted JSON shape may nest these under `data` (matching the
    // SDK's `token.data.*` access pattern) — handle both shapes.
    const data = result.data || result;

    const orderid       = data.orderid || data.TRANSACTIONID || data.order_id;
    const transactionId = data.ap_transactionid || data.APTRANSACTIONID || data.transactionid;
    const paymentStatus = (
      data.transaction_status ||
      data.TRANSACTIONSTATUS ||
      data.status ||
      ''
    ).toString().toUpperCase();

    const sub = await Subscription.findOne({ airpayOrderId: orderid });
    if (!sub) {
      console.error('No matching subscription for orderid:', orderid);
      return res.redirect('buildtrack://payment/failure?reason=order_not_found');
    }

    // Per the PDF: TRANSACTIONSTATUS successful = 200 (a numeric/string
    // status code), not the word "SUCCESS" — adjust the check accordingly.
    const isSuccess = paymentStatus === '200' || paymentStatus === 'SUCCESS';

    if (isSuccess) {
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
// =================================================================
router.get('/status', protect, async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      userId:  req.user._id,
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