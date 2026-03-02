import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as services from "./services/index.js";

/**
 * Register task-oriented prompts with the MCP server
 *
 * All prompts follow a consistent structure:
 * - Clear objective statement
 * - Step-by-step instructions
 * - Expected outputs
 * - Safety/security considerations
 *
 * Prompts guide the model through complex workflows that would otherwise
 * require multiple tool calls in the correct sequence.
 *
 * @param server The MCP server instance
 * @param options Registration options
 */
export function registerTRONPrompts(server: McpServer, options: { readOnly?: boolean } = {}) {
  const { isWalletConfigured } = services;

  /**
   * Helper to register a prompt with automatic wallet requirement detection.
   * Prompts that guide write operations should only be registered if a wallet
   * is configured and we are not in read-only mode.
   */
  const registerPrompt = <T extends z.ZodRawShape>(
    name: string,
    definition: {
      description?: string;
      argsSchema?: T;
    },
    handler: (args: z.infer<z.ZodObject<T>>) => any,
    extra: { requiresWallet?: boolean; isReadOnly?: boolean } = {},
  ) => {
    // Default to true: most prompts are informational and safe in readonly mode.
    // This differs from tools.ts where the default is false (write-capable) because
    // unregistered tools could mutate state, while prompts only guide the LLM.
    const isReadOnly = extra.isReadOnly !== false;
    const walletNeeded = extra.requiresWallet === true;

    // 1. Skip if in read-only mode and the prompt is for write operations
    if (options.readOnly && !isReadOnly) {
      return;
    }

    // 2. Skip if the prompt needs a wallet but none is configured
    if (walletNeeded && !isWalletConfigured()) {
      return;
    }

    server.registerPrompt(name, definition as any, handler as any);
  };

  // ============================================================================
  // TRANSACTION PROMPTS
  // ============================================================================

  registerPrompt(
    "prepare_transfer",
    {
      description: "Safely prepare and execute a token transfer with validation checks",
      argsSchema: {
        tokenType: z
          .enum(["trx", "trc20"])
          .describe("Token type: 'trx' for native or 'trc20' for contract tokens"),
        recipient: z.string().describe("Recipient address"),
        amount: z.string().describe("Amount to transfer (in TRX or token units)"),
        network: z.string().optional().describe("Network name (default: mainnet)"),
        tokenAddress: z.string().optional().describe("Token contract address (required for TRC20)"),
      },
    },
    ({ tokenType, recipient, amount, network = "mainnet", tokenAddress }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# Token Transfer Task

**Objective**: Safely transfer ${amount} ${tokenType === "trx" ? "TRX" : "TRC20 tokens"} to ${recipient} on ${network}

## Validation & Checks
Before executing any transfer:
1. **Wallet Verification**: Call \`get_wallet_address\` to confirm the sending wallet
2. **Balance Check**:
   ${
     tokenType === "trx"
       ? "- Call `get_balance` to verify TRX balance"
       : `- Call \`get_token_balance\` with tokenAddress=${tokenAddress} to verify balance`
   }
3. **Resource Analysis**: Call \`get_chain_parameters\` to assess current network costs (Energy/Bandwidth)

## Execution Steps
${
  tokenType === "trx"
    ? `
1. Summarize: sender address, recipient, amount, and estimated cost
2. Request confirmation from user
3. Call \`transfer_trx\` with to="${recipient}", amount="${amount}", network="${network}"
4. Return transaction hash to user
5. Call \`get_transaction_info\` to confirm completion
`
    : `
1. Summarize: sender, recipient, token, amount
2. Request confirmation
3. Call \`transfer_trc20\` with tokenAddress, recipient, amount
4. Wait for confirmation with \`get_transaction_info\`
`
}

## Output Format
- **Transaction Hash**: Clear hex value
- **Status**: Pending or Confirmed
- **User Confirmation**: Always ask before sending

## Safety Considerations
- Never send more than available balance
- Double-check recipient address
- Explain any approval requirements
`,
          },
        },
      ],
    }),
    { requiresWallet: true, isReadOnly: false },
  );

  registerPrompt(
    "interact_with_contract",
    {
      description:
        "Safely execute write operations on a smart contract with validation and confirmation",
      argsSchema: {
        contractAddress: z.string().describe("Contract address to interact with"),
        functionName: z.string().describe("Function to call (e.g., 'mint', 'swap', 'stake')"),
        args: z.string().optional().describe("Comma-separated function arguments"),
        value: z.string().optional().describe("TRX value to send (for payable functions)"),
        network: z.string().optional().describe("Network name (default: mainnet)"),
      },
    },
    ({ contractAddress, functionName, args, value, network = "mainnet" }) => {
      const argsList = args ? args.split(",").map((a) => a.trim()) : [];
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `# Smart Contract Interaction

**Objective**: Safely execute ${functionName} on contract ${contractAddress} on ${network}

## Prerequisites Check

### 1. Wallet Verification
- Call \`get_wallet_address\` to confirm the wallet that will execute this transaction
- Verify this is the correct wallet for this operation

### 2. Contract Analysis
- Use \`read_contract\` or external knowledge to understand the function parameters
- Check function type:
  * **View/Pure**: Read-only (use \`read_contract\` instead)
  * **Nonpayable**: State-changing, no TRX required
  * **Payable**: State-changing, can accept TRX

### 3. Function Parameter Validation
For function: **${functionName}**
${argsList.length > 0 ? `Arguments provided: ${argsList.join(", ")}` : "No arguments provided"}

- Verify parameter types match the contract requirements
- Validate addresses are correct (Base58 or Hex)
- Check numeric values are in correct units

### 4. Pre-execution Checks

**Balance Check**:
- Call \`get_balance\` to verify sufficient TRX balance
- Account for Energy/Bandwidth costs + value (if payable)

**Resource Estimation**:
- Call \`get_chain_parameters\` to check current unit prices
- Estimate Energy and Bandwidth usage

## Execution Process

### 1. Present Summary to User
Before executing, show:
- **Contract**: ${contractAddress}
- **Network**: ${network}
- **Function**: ${functionName}
- **Arguments**: ${argsList.length > 0 ? argsList.join(", ") : "None"}
${value ? `- **Value**: ${value} TRX` : ""}
- **From**: [wallet address from step 1]
- **Estimated Resource Cost**: [Energy / Bandwidth estimation]

### 2. Request User Confirmation
⚠️ **IMPORTANT**: Always ask user to confirm before executing write operations
- Clearly state what will happen
- Show all costs involved
- Explain any risks or irreversible actions

### 3. Execute Transaction
Only after user confirms:
\`\`\`
Call write_contract with:
- contractAddress: "${contractAddress}"
- functionName: "${functionName}"
${argsList.length > 0 ? `- args: ${JSON.stringify(argsList)}` : ""}
${value ? `- value: "${value}"` : ""}
- network: "${network}"
\`\`\`

### 4. Monitor Transaction
After execution:
1. Return transaction hash to user
2. Call \`get_transaction_info\` to verify success
3. If failed, call \`diagnose_transaction\` to understand why

## Output Format

**Pre-Execution Summary**:
- Contract details
- Function and parameters
- Cost breakdown
- Risk assessment

**Confirmation Request**:
"Ready to execute ${functionName} on ${contractAddress}. Proceed? (yes/no)"

**Execution Result**:
- Transaction Hash: [hash]
- Status: Pending/Confirmed/Failed
- Energy Used: [actual energy used]
- Bandwidth Used: [actual bandwidth used]

## Safety Considerations

### Critical Checks
- ✅ Check function parameters are correct type and format
- ✅ Ensure sufficient balance for fees + value
- ✅ Validate addresses (no typos, correct network)
- ✅ Understand what the function does before calling

### Common Risks
- **Irreversible**: Most blockchain transactions cannot be undone
- **Fee Loss**: Failed transactions still consume Energy/Bandwidth
- **Approval Risks**: Be careful with unlimited approvals
- **Access Control**: Verify you have permission to call this function
`,
            },
          },
        ],
      };
    },
    { requiresWallet: true, isReadOnly: false },
  );

  registerPrompt(
    "diagnose_transaction",
    {
      description: "Analyze transaction status, failures, and provide debugging insights",
      argsSchema: {
        txHash: z.string().describe("Transaction hash to diagnose"),
        network: z.string().optional().describe("Network name (default: mainnet)"),
      },
    },
    ({ txHash, network = "mainnet" }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# Transaction Diagnosis

**Objective**: Analyze transaction ${txHash} on ${network} and identify any issues

## Investigation Process

### 1. Gather Transaction Data
- Call \`get_transaction\` to fetch transaction details
- Call \`get_transaction_info\` to get status and energy/bandwidth used
- Note: both calls are read-only and free

### 2. Status Assessment
Determine transaction state:
- **Pending**: Not yet mined
- **Confirmed**: Successfully executed (contractRet='SUCCESS')
- **Failed**: Execution failed (contractRet='REVERT' or other error)

### 3. Failure Analysis
If transaction failed, investigate:

**Out of Energy**:
- Check energy_usage vs energy_limit
- If usage >= limit, suggest increasing fee limit

**Contract Revert**:
- Check function called and parameters
- Verify sufficient balance/approvals
- Look for require/revert statements in contract

### 4. Resource Analysis
- Calculate energy/bandwidth cost
- Compare to current chain parameters

## Output Format

Provide structured diagnosis:
- **Status**: Pending/Confirmed/Failed with reason
- **Transaction Hash**: The hash analyzed
- **From/To**: Addresses involved
- **Resource Usage**: Energy / Bandwidth used
- **Issue (if failed)**: Root cause and explanation
- **Recommended Actions**: Next steps to resolve
`,
          },
        },
      ],
    }),
  );

  registerPrompt(
    "explain_tron_concept",
    {
      description: "Explain TRON and blockchain concepts with examples",
      argsSchema: {
        concept: z
          .string()
          .describe(
            "Concept to explain (Energy, Bandwidth, Super Representative, TRC20, TRC721, etc)",
          ),
      },
    },
    ({ concept }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# Concept Explanation: ${concept}

**Objective**: Provide clear, practical explanation of "${concept}"

## Explanation Structure

### 1. Definition
- What is it?
- Simple one-sentence summary
- Technical name/terminology

### 2. How It Works
- Step-by-step explanation
- Why it exists/why it's important (e.g., Resource model prevents spam)
- How it relates to TRON blockchain

### 3. Real-World Analogy
- Compare to familiar concept (e.g., Bandwidth like internet data, Energy like CPU time)
- Make it relatable for beginners
- Highlight key differences

### 4. Practical Examples
- Real transaction scenarios
- Numbers and metrics where applicable (e.g., Transfer costs ~300 Bandwidth)
- Common scenarios
- Edge cases or gotchas

### 5. Relevance to Users
- Why should developers/users care?
- How does it affect transactions/costs?
- How to optimize (e.g., Staking for resources)?
- Common mistakes to avoid

## Output Format

Provide explanation in sections:

**What is ${concept}?**
[Definition and overview]

**How Does It Work?**
[Mechanics and process]

**Example**
[Real or hypothetical scenario]

**Key Takeaways**
[Bullet points of important facts]

**Common Questions**
- Question 1? Answer
- Question 2? Answer

## Important
- Use clear, non-technical language first
- Progress to technical details
- Include concrete numbers where helpful
- Be honest about complexity
- Suggest further learning if needed
`,
          },
        },
      ],
    }),
  );

  // ============================================================================
  // WALLET ANALYSIS PROMPTS
  // ============================================================================

  registerPrompt(
    "analyze_wallet",
    {
      description: "Get comprehensive overview of wallet assets, balances, and activity",
      argsSchema: {
        address: z.string().describe("Wallet address to analyze"),
        network: z.string().optional().describe("Network name (default: mainnet)"),
        tokens: z.string().optional().describe("Comma-separated token addresses to check"),
      },
    },
    ({ address, network = "mainnet", tokens }) => {
      const tokenList = tokens ? tokens.split(",").map((t) => t.trim()) : [];
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `# Wallet Analysis

**Objective**: Provide complete asset overview for ${address} on ${network}

## Information Gathering

### 1. Address Resolution
- Call \`convert_address\` to get both Hex and Base58 formats

### 2. Native Token Balance
- Call \`get_balance\` to fetch TRX balance
- Report both sun and TRX formats

### 3. Token Balances
${
  tokenList.length > 0
    ? `- Call \`get_token_balance\` for each token:\n${tokenList.map((t) => `  * ${t}`).join("\n")}`
    : `- If specific tokens provided: call \`get_token_balance\` for each`
}

## Output Format

Provide analysis with clear sections:

**Wallet Overview**
- Address (Base58): [address]
- Address (Hex): [hex]
- Network: [network]

**TRX Balance**
- TRX: [formatted amount]
- Sun: [raw amount]

**Token Holdings** (if requested)
- Token: [address]
- Symbol: [symbol]
- Balance: [formatted]
- Decimals: [decimals]

**Summary**
- Primary holdings
- Notable observations
`,
            },
          },
        ],
      };
    },
  );

  // ============================================================================
  // NETWORK & EDUCATION PROMPTS
  // ============================================================================

  registerPrompt(
    "check_network_status",
    {
      description: "Check current network health and conditions",
      argsSchema: {
        network: z.string().optional().describe("Network name (default: mainnet)"),
      },
    },
    ({ network = "mainnet" }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# Network Status Check

**Objective**: Assess health and current conditions of ${network}

## Status Assessment

### 1. Gather Current Data
Call these read-only tools:
- \`get_chain_info\` for chain ID and current block number
- \`get_latest_block\` for block details and timing
- \`get_chain_parameters\` for current resource costs

### 2. Network Health Analysis

**Block Production**:
- Current block number
- Block timing (normal ~3 sec for Tron)
- Consistent vs irregular blocks

**Resource Market**:
- Energy Fee
- Bandwidth Fee

**Overall Status**:
- Operational: Yes/No
- Issues detected: Yes/No

## Output Format

**Network Status Report: ${network}**

**Overall Status**
- Operational Status: [Online/Degraded/Offline]
- Current Block: [number]
- Network Time: [timestamp]

**Performance Metrics**
- Block Time: [seconds] (normal: 3s)
- Energy Fee: [amount]
- Bandwidth Fee: [amount]

**Recommendations**

For **sending transactions now**:
- Status is Green/Yellow/Red
`,
          },
        },
      ],
    }),
  );
}
