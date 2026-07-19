import 'server-only';

type PushDebugStep =
  | 'message_created'
  | 'message_preview_resolved'
  | 'push_event_generated'
  | 'push_input_resolved'
  | 'suppression_decision'
  | 'device_scan'
  | 'device_skipped'
  | 'fcm_request_sent'
  | 'firebase_multicast_built'
  | 'firebase_response'
  | 'invalid_tokens_removed'
  | 'sw_background_message_received'
  | 'sw_show_notification_called'
  | 'sw_notification_displayed'
  | 'push_skipped'
  | 'push_completed';

type PushDebugEntry = {
  timestamp: string;
  step: PushDebugStep;
  data: Record<string, unknown>;
};

export type PushDebugPipeline = {
  eventKey: string;
  source: string;
  type: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  entries: PushDebugEntry[];
};

type PushDebugStore = {
  pipelines: Map<string, PushDebugPipeline>;
  latestEventKeys: string[];
};

const STORE_KEY = '__cinexium_push_debug_store__';
const MAX_PIPELINES = 100;

function getStore(): PushDebugStore {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: PushDebugStore;
  };

  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = {
      pipelines: new Map(),
      latestEventKeys: [],
    };
  }

  return globalStore[STORE_KEY] as PushDebugStore;
}

function touchEventKey(eventKey: string) {
  const store = getStore();
  store.latestEventKeys = [eventKey, ...store.latestEventKeys.filter((key) => key !== eventKey)].slice(0, MAX_PIPELINES);

  while (store.pipelines.size > MAX_PIPELINES) {
    const staleKey = store.latestEventKeys.pop();
    if (!staleKey) {
      break;
    }

    store.pipelines.delete(staleKey);
  }
}

export function ensurePushDebugPipeline(params: {
  eventKey: string;
  source: string;
  type: string;
  userId: string;
}) {
  const store = getStore();
  const existing = store.pipelines.get(params.eventKey);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const pipeline: PushDebugPipeline = {
    eventKey: params.eventKey,
    source: params.source,
    type: params.type,
    userId: params.userId,
    createdAt: now,
    updatedAt: now,
    entries: [],
  };

  store.pipelines.set(params.eventKey, pipeline);
  touchEventKey(params.eventKey);
  return pipeline;
}

export function logPushDebug(params: {
  eventKey: string;
  source: string;
  type: string;
  userId: string;
  step: PushDebugStep;
  data: Record<string, unknown>;
}) {
  const store = getStore();
  const pipeline = ensurePushDebugPipeline({
    eventKey: params.eventKey,
    source: params.source,
    type: params.type,
    userId: params.userId,
  });

  pipeline.entries.push({
    timestamp: new Date().toISOString(),
    step: params.step,
    data: params.data,
  });
  pipeline.updatedAt = new Date().toISOString();
  store.pipelines.set(params.eventKey, pipeline);
  touchEventKey(params.eventKey);
}

export function getPushDebugPipeline(eventKey: string) {
  return getStore().pipelines.get(eventKey) ?? null;
}

export function getLatestMessagePushDebug() {
  const store = getStore();
  for (const eventKey of store.latestEventKeys) {
    const pipeline = store.pipelines.get(eventKey);
    if (pipeline?.source === 'message') {
      return pipeline;
    }
  }

  return null;
}
