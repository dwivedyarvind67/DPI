export type Flow = {
  id: string;
  src: string;
  sport: number;
  dst: string;
  dport: number;
  proto: 'TCP' | 'UDP';
  worker: number;
  action: 'forward' | 'drop';
  timestamp: number;
};

export type WorkerStat = {
  id: number;
  processed: number;
  queueDepth: number;
  loadPct: number;
};

export type PipelineStats = {
  running: boolean;
  totalRead: number;
  totalForwarded: number;
  totalDropped: number;
  workers: WorkerStat[];
  pps: number; // packets/sec, current
};

export type Rule = {
  id: string;
  field: 'dport' | 'proto' | 'srcIp' | 'dstIp';
  op: '=' | '!=';
  value: string;
  action: 'forward' | 'drop';
};
