// frontend/src/types/index.ts
export interface Message {
  id: string;
  from?: string;
  to?: string;
  body: string;
  timestamp: number;
  direction: "incoming" | "outgoing";
  type: string;
  createdAt?: string;
}

export interface Rule {
  id: string;
  name: string;
  keywords: string[];
  response: string;
  enabled: boolean;
  priority: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectionStatus {
  state: "qr" | "authenticated" | "ready" | "disconnected" | "auth_failure";
  message?: string;
}

export interface MessageStats {
  totalMessages: number;
  incomingCount: number;
  outgoingCount: number;
  uniqueContacts: number;
  todayMessages: number;
}
