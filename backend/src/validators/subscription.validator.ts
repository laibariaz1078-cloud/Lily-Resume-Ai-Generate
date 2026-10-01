import { z } from 'zod';

export const subscriptionUpgradeSchema = z.object({ plan: z.literal('PREMIUM') }).strict();