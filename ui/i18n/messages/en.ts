const en = {
  Common: {
    search: "Search",
    searching: "Searching...",
    walletAddress: "Wallet address",
    yes: "Yes",
    no: "No",
    notFoundMiner: "Miner not found in any pool.",
    poolServerError: "Error contacting the pool server."
  },
  Header: {
    pools: "Pools",
    miner: "Miner",
    language: "Language",
    english: "English",
    portuguese: "Portuguese"
  },
  Home: {
    welcomeBadge: "welcome",
    tagline: "Fast, transparent & simple mining pools",
    exploreallpools: "Explore all pools",
    viewPools: "View pools",
    minerLookup: "Miner lookup",
    tip: "Tip: to connect your miner, open a pool and copy the endpoint",
    endpoint: "stratum+tcp://coin.hashstorm.org:PORT"
  },
  Stat: {
    pools: "Pools",
    connectedMiners: "Connected miners",
    totalHashrate: "Total hashrate",
    miners: "Miners",
    netDiff: "Net Diff",
    netDifficulty: "Net Difficulty",
    poolHashrate: "Pool Hashrate",
    networkHashrate: "Network Hashrate",
    pendingShares: "Pending shares",
    pendingBalance: "Pending balance",
    totalPaid: "Total paid",
    todayPaid: "Today paid",
    minerEffort: "Miner effort",
  },
  allpoolsPage: {
    title: "Pools",
    subtitle: "All Pools",
    poolsCount: "Pools"
  },
  CoinPools: {
    noPools: "No pools for {symbol}."
  },
  PoolsPage: {
    title: "Pools"
  },
  Pool: {
    performanceTitle: "Performance (last hours)",
    topMiners: "Top miners",
    table: {
      miner: "Miner",
      hashrate: "Hashrate",
      sharesS: "Shares/s",
      pendingShares: "Pending shares",
      port: "Port",
      diff: "Diff",
      vardiff: "VarDiff (min - max)",
      target: "Target",
      tls: "TLS",
      url: "URL",
      address: "Address",
      amount: "Amount",
      tx: "TX",
      date: "Date",
      status: "Status",
      height: "Height",
      efficiency: "Efficiency",
      hash: "Hash",
      worker: "Worker"
    },
    sections: {
      ports: "Ports",
      pool: "Pool",
      community: "Community",
      hashrateHistory: "Hashrate (History)",
      workersSnapshot: "Workers (snapshot {date})"
    },
    links: {
      all: "All",
      miners: "/miners",
      blocks: "Blocks",
      payments: "Payments"
    },
    metaRight: "{scheme} | fee {fee}% | min {min}"
  },
  Miner: {
    lookupTitle: "Miner Lookup",
  }
} as const;

export default en;
