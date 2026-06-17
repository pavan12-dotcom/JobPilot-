// src/api/routes/notifications.routes.js
const express = require('express');
const { z } = require('zod');
const prisma = require('../../db/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const pushService = require('../../services/push.service');

const router = express.Router();

// GET /api/notifications/vapid-key — Get VAPID public key
router.get(
  '/vapid-key',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        vapidKey: pushService.VAPID_PUBLIC_KEY || null,
      },
    });
  }),
);

// POST /api/notifications/subscribe — Save push subscription
router.post(
  '/subscribe',
  authenticate,
  validate({
    body: z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { endpoint, keys } = req.body;

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    let subscription;
    if (existing) {
      subscription = await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          user_id: req.user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
    } else {
      subscription = await prisma.pushSubscription.create({
        data: {
          user_id: req.user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
    }

    res.json({
      success: true,
      data: subscription,
    });
  }),
);

module.exports = router;
