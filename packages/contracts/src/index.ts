import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  readiness: z.literal("ready"),
  dependencies: z.object({
    api: z.literal("up")
  })
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const DependencyStatusSchema = z.object({
  status: z.enum(["ready", "degraded"]),
  dependencies: z.object({
    mongodb: z.enum(["up", "down"]),
    qdrant: z.enum(["up", "down"]),
    ollama: z.enum(["up", "down"])
  })
});

export type DependencyStatus = z.infer<typeof DependencyStatusSchema>;
