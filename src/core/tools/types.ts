import { z } from "zod";

export type RegisterToolFn = <T extends z.ZodRawShape>(
  name: string,
  definition: {
    inputSchema?: T;
    description?: string;
    annotations?: {
      title?: string;
      readOnlyHint?: boolean;
      requiresWallet?: boolean;
      destructiveHint?: boolean;
      idempotentHint?: boolean;
      openWorldHint?: boolean;
    };
  },
  handler: (args: z.infer<z.ZodObject<T>>) => Promise<any>,
) => void;
