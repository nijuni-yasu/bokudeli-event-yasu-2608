export type EventCopyRepeatRequest = {
  srcEventId: string
  startTimes: number[]
}

export type EventCopyRepeatResultItem =
  | { ok: true; startTime: number; newEventId: string }
  | { ok: false; startTime: number; reason: string }

export type EventCopyRepeatResponse = {
  results: EventCopyRepeatResultItem[]
  successCount: number
  failureCount: number
}
