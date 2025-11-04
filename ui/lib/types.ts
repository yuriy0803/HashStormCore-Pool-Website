// ui/lib/types.ts
export type VarDiff = {
  minDiff: number; maxDiff: number; maxDelta: number;
  targetTime: number; retargetTime: number; variancePercent: number;
};

export type PortCfg = {
  listenAddress: string;
  difficulty?: number;
  varDiff?: VarDiff;
  tls?: boolean;
  tlsAuto?: boolean;
};

export type CoinInfo = {
  type: string; name: string; symbol: string;
  website?: string; market?: string; family?: string; algorithm?: string;
  twitter?: string; discord?: string; telegram?: string;
};

export type PaymentProcessing = {
  enabled: boolean;
  minimumPayment: number;
  payoutScheme: string;               // "SOLO" | "PPLNS" | ...
  payoutSchemeConfig?: { factor?: number };
};

export type PoolStats = {
  connectedMiners: number;
  poolHashrate: number;
  sharesPerSecond: number;
};

export type NetworkStats = {
  networkType: string;
  networkHashrate: number;
  networkDifficulty: number;
  nextNetworkTarget?: string;
  nextNetworkBits?: string;
  lastNetworkBlockTime?: string;
  blockHeight?: number;
  connectedPeers?: number;
  nodeVersion?: string;
  rewardType?: string;
};

export type TopMiner = {
  miner: string;
  hashrate: number;
  sharesPerSecond: number;
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
  topMiners?: TopMiner[];
  totalPaid: number;
  totalBlocks: number;
  totalConfirmedBlocks: number;
  totalPendingBlocks: number;
  blockReward: number;
  lastPoolBlockTime?: string;
  poolEffort: number;
};

export type PoolsResponse = { pools: Pool[] };
export type PoolResponse = { pool: Pool };

export type MinerListItem = {
  miner: string;
  hashrate: number;
  sharesPerSecond: number;
};

export type MinerDetail = {
  pendingShares: number;
  pendingBalance: number;
  totalPaid: number;
  todayPaid: number;
  minerEffort: number;
  performance: {
    created: string;
    workers: Record<string, { hashrate: number; sharesPerSecond: number }>;
  };
  performanceSamples: {
    created: string;
    workers: Record<string, { hashrate: number; sharesPerSecond: number }>;
  }[];
  totalConfirmedBlocks: number;
  totalPendingBlocks: number;
};

export type BlockItem = {
  poolId: string;
  blockHeight: number;
  networkDifficulty: number;
  status: string;
  confirmationProgress: number;
  effort: number;
  minerEffort: number;
  transactionConfirmationData: string;
  reward: number;
  hash: string;
  miner: string;
  created: string;
};

export type PaymentItem = {
  coin: string;
  address: string;
  addressInfoLink: string;
  amount: number;
  transactionConfirmationData: string;
  transactionInfoLink: string;
  created: string;
};

export type PoolPerfPoint = {
  poolHashrate: number;
  connectedMiners: number;
  validSharesPerSecond: number;
  networkHashrate: number;
  networkDifficulty: number;
  created: string;
};

export type MinerPerfPoint = {
  created: string;
  workers: Record<string, { hashrate: number; sharesPerSecond: number }>;
};
