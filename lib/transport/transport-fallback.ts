import type { Platform } from "@/types";
import { TransportPeer, TransportType } from "./types";

// Score each transport type based on reliability, speed, and power usage
const TRANSPORT_SCORES = {
  [TransportType.BLUETOOTH]: {
    reliability: 8, // Very reliable for short ranges
    speed: 6, // Moderate speed
    power: 7, // Good power efficiency
    range: 5, // Short to medium range
  },
  [TransportType.WIFI_DIRECT]: {
    reliability: 9, // Very reliable
    speed: 9, // High speed
    power: 5, // Moderate power usage
    range: 8, // Good range
  },
  [TransportType.NFC]: {
    reliability: 10, // Most reliable
    speed: 5, // Moderate speed
    power: 9, // Very power efficient
    range: 1, // Very short range
  },
  [TransportType.MULTIPEER]: {
    reliability: 8, // Good reliability
    speed: 8, // Good speed
    power: 6, // Moderate power usage
    range: 7, // Good range
  },
};

// Weight factors for different priorities
const PRIORITY_WEIGHTS = {
  speed: {
    reliability: 0.3,
    speed: 0.5,
    power: 0.1,
    range: 0.1,
  },
  reliability: {
    reliability: 0.5,
    speed: 0.2,
    power: 0.1,
    range: 0.2,
  },
  power: {
    reliability: 0.2,
    speed: 0.2,
    power: 0.5,
    range: 0.1,
  },
};

type TransportPriority = "speed" | "reliability" | "power";

export function calculateTransportScore(
  transport: TransportType,
  priority: TransportPriority,
  batteryLevel?: number,
  signalStrength?: number
): number {
  const scores = TRANSPORT_SCORES[transport];
  const weights = PRIORITY_WEIGHTS[priority];

  let score = 0;
  for (const [metric, weight] of Object.entries(weights)) {
    score += scores[metric as keyof typeof scores] * weight;
  }

  // Adjust score based on battery level
  if (batteryLevel !== undefined && batteryLevel < 20) {
    // Penalize high power usage transports when battery is low
    score *= 1 - 0.5 * (1 - batteryLevel / 100);
  }

  // Adjust score based on signal strength (if available)
  if (signalStrength !== undefined) {
    // signalStrength should be normalized between 0 and 1
    score *= 0.5 + 0.5 * signalStrength;
  }

  return score;
}

export function getFallbackTransports(
  platform: Platform,
  batteryLevel?: number,
  signalStrength?: number,
  priority: TransportPriority = "reliability"
): TransportType[] {
  const availableTransports = [];

  // Start with the common transports
  availableTransports.push(TransportType.BLUETOOTH);

  if (platform === "ios") {
    availableTransports.push(TransportType.MULTIPEER);
    availableTransports.push(TransportType.NFC);
  } else {
    availableTransports.push(TransportType.WIFI_DIRECT);
    availableTransports.push(TransportType.NFC);
  }

  // Sort transports by score
  return availableTransports.sort((a, b) => {
    const scoreA = calculateTransportScore(
      a,
      priority,
      batteryLevel,
      signalStrength
    );
    const scoreB = calculateTransportScore(
      b,
      priority,
      batteryLevel,
      signalStrength
    );
    return scoreB - scoreA;
  });
}

// Function to filter available peers by transport preference
export function filterPeersByTransport(
  peers: TransportPeer[],
  preferredTransports: TransportType[],
  platform: Platform
): TransportPeer[] {
  // Group peers by their ID to handle multiple transport capabilities
  const peerGroups = new Map<string, TransportPeer[]>();

  for (const peer of peers) {
    const group = peerGroups.get(peer.id) || [];
    group.push(peer);
    peerGroups.set(peer.id, group);
  }

  // Sort peers by their best available transport
  const rankedPeers: { peer: TransportPeer; score: number }[] = [];

  for (const [, peerGroup] of peerGroups) {
    // Find the peer's highest-ranked transport
    let bestScore = -1;
    let bestPeer: TransportPeer | null = null;

    for (const peer of peerGroup) {
      const transportIndex = preferredTransports.indexOf(peer.type);
      if (transportIndex !== -1) {
        const score = preferredTransports.length - transportIndex;
        if (score > bestScore) {
          bestScore = score;
          bestPeer = peer;
        }
      }
    }

    if (bestPeer && bestScore > 0) {
      rankedPeers.push({ peer: bestPeer, score: bestScore });
    }
  }

  // Sort by score and return just the peers
  return rankedPeers.sort((a, b) => b.score - a.score).map(({ peer }) => peer);
}
