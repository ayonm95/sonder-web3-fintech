import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_POLYGON_CHAIN_ID: z.string().default('80002'),
  NEXT_PUBLIC_POLYGON_RPC: z.string().default('https://rpc-amoy.polygon.technology'),
  NEXT_PUBLIC_SETTLEMENT_MANAGER_ADDRESS: z
    .string()
    .default('0x9486c9A197D87b409743D7510795c643F72B5678'),
  NEXT_PUBLIC_CREATOR_CLAIMS_ADDRESS: z
    .string()
    .default('0xb61136b637f5d6fF87123A11C238622c83c27f51'),
  NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS: z.string().optional(),
  JWT_SECRET: z.string().default('creator-music-super-secure-local-dev-jwt-secret-key-32-bytes'),
});

export const env = envSchema.parse(process.env);
