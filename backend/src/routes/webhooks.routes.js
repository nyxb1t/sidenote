import express from 'express';
import { supabase } from '../config/supabase.js';
const router = express.Router();

router.post('/revenuecat', async (req, res) => {
  try {
    const { event } = req.body || {};
    if (!event) return res.status(400).json({ error: 'No event data' });

    console.log(`[RevenueCat Webhook] Received event: ${event.type} for app_user_id: ${event.app_user_id}`);

    const userId = event.app_user_id; // assuming app_user_id is the supabase user_id
    if (!userId) return res.status(400).json({ error: 'Missing app_user_id' });

    let plan = 'free';
    if (['INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE', 'UNCANCELLATION', 'PRODUCT_CHANGE'].includes(event.type)) {
      const prodId = event.product_id?.toLowerCase() || '';
      if (prodId.includes('basic')) plan = 'basic';
      else if (prodId.includes('pro')) plan = 'pro';
      else if (prodId.includes('advanced')) plan = 'advanced';
      else plan = 'pro'; // default fallback for entitlement
    } else if (['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'].includes(event.type)) {
      plan = 'free';
    } else {
      // Ignore other events like TEST
      return res.status(200).json({ received: true, ignored: true });
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert({ user_id: userId, plan: plan, updated_at: new Date().toISOString() });

    if (error) {
      console.error('[RevenueCat Webhook] Supabase upsert error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ received: true, plan_updated_to: plan });
  } catch (err) {
    console.error('[RevenueCat Webhook] Error processing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const webhooksRouter = router;
