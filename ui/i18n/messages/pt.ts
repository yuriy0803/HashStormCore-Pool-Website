// ui/i18n/messages/pt.ts

const pt = {
  Common: {
    search: "Procurar",
    searching: "A procurar...",
    walletAddress: "Endereço da carteira",
    yes: "Sim",
    no: "Não",
    notFoundMiner: "Miner não encontrado em nenhuma pool.",
    poolServerError: "Erro a comunicar com o servidor da pool."
  },
  Header: {
    pools: "Pools",
    miner: "Miner",
    language: "Idioma",
    english: "Inglês",
    portuguese: "Português"
  },
  Home: {
    welcomeBadge: "Bem vindo",
    tagline: "Pools rápidas, transparentes e simples",
    viewPools: "Ver pools",
    minerLookup: "Procurar miner",
    tip: "Dica: para ligar o miner, abre uma pool e copia o endpoint",
    endpoint: "stratum+tcp://coin.hashstorm.org:PORT"
  },
  Stat: {
    coins: "Coins",
    pools: "Pools",
    connectedMiners: "Miners ligados",
    totalHashrate: "Total hashrate",
    miners: "Miners",
    netDiff: "Net Diff",
    netDifficulty: "Dificuldade da rede",
    poolHashrate: "Pool Hashrate",
    networkHashrate: "Network Hashrate",
    pendingShares: "Pending shares",
    pendingBalance: "Saldo pendente",
    totalPaid: "Total pago",
    todayPaid: "Pago hoje",
    minerEffort: "Esforço do miner"
  },
  allpoolsPage: {
    title: "Pools",
    subtitle: "Todas as Pools",
    poolsCount: "Pools"
  },
  CoinPools: {
    noPools: "Sem pools para {symbol}."
  },
  PoolsPage: {
    title: "Pools"
  },
  Pool: {
    performanceTitle: "Desempenho (últimas horas)",
    topMiners: "Top miners",
    table: {
      miner: "Miner",
      hashrate: "Hashrate",
      sharesS: "Shares/s",
      pendingShares: "Pending shares",
      port: "Porta",
      diff: "Diff",
      vardiff: "VarDiff (min - max)",
      target: "Target",
      tls: "TLS",
      url: "URL",
      address: "Endereço",
      amount: "Quantia",
      tx: "TX",
      date: "Data",
      status: "Estado",
      height: "Altura",
      efficiency: "Eficiência",
      hash: "Hash",
      worker: "Worker"
    },
    sections: {
      ports: "Portas",
      pool: "Pool",
      poolinfo: "Pool Info",
      community: "Comunidade",
      hashrateHistory: "Hashrate (Histórico)",
      workersSnapshot: "Workers (snapshot {date})"
    },
    links: {
      all: "Todos",
      miners: "/miners",
      blocks: "Blocos",
      payments: "Pagamentos"
    },
    metaRight: "{scheme} | taxa {fee}% | min {min}"
  },
  Miner: {
    lookupTitle: "Pesquisar Miner",
  }
} as const;

export default pt;
