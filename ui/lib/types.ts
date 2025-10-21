export type VarDiff = {
  minDiff: number;
  maxDiff: number;
  maxDelta: number;
  targetTime: number;
  retargetTime: number;
  variancePercent: number;
};

export type PortCfg = {
  listenAddress: string;
  difficulty?: number;
  varDiff?: VarDiff;
  tls?: boolean;
  tlsAuto?: boolean;
};

export type CoinInfo = {
  type: string;
  name: string;
  symbol: string;
  website?: string;
  market?: string;
  family?: string;
  algorithm?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
};

export type PaymentProcessing = {
  enabled: boolean;
  minimumPayment: number;
  payoutScheme: string; // "SOLO" | "PPLNS" | etc.
  payoutSchemeConfig?: { factor?: number };
};

export type PoolStats = {
  connectedMiners: number;
  poolHashrate: number;       // H/s
  sharesPerSecond: number;
};

export type NetworkStats = {
  networkType: string;
  networkHashrate: number;
  networkDifficulty: number;
  nextNetworkTarget?: string;
  nextNetworkBits?: string;
  lastNetworkBlockTime?: string; // ISO
  blockHeight?: number;
  connectedPeers?: number;
  nodeVersion?: string;
  rewardType?: string;
};

export type Pool = {
  id: string;
  coin: CoinInfo;
  ports: Record<string, PortCfg>;
  paymentProcessing: PaymentProcessing;
  clientConnectionTimeout: number;
  jobRebroadcastTimeout: number;
  blockRefreshInterval: number;
  poolFeePercent: number;
  address: string;
  addressInfoLink?: string;
  poolStats: PoolStats;
  networkStats: NetworkStats;
  totalPaid: number;
  totalBlocks: number;
  totalConfirmedBlocks: number;
  totalPendingBlocks: number;
  blockReward: number;
  poolEffort: number;
};

export type PoolsResponse = { pools: Pool[] };

// for the Miner page:
export type MinerStats = {
  address: string;
  poolId: string;
  hashrate: number;
  sharesPerSecond?: number;
  pendingBalance?: number;
  totalPaid?: number;
  lastShare?: string;
  payments?: Array<{ txId: string; amount: number; created: string }>;
};
