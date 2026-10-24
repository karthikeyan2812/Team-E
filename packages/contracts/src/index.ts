import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  readiness: z.literal("ready"),
  dependencies: z.object({
    api: z.literal("up")
  })
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

