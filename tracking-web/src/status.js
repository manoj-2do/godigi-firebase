export const TaskStatus = Object.freeze({
    UNASSIGNED:        0,
    ASSIGNED:          1,
    ACCEPTED:          2,
    HEADED_FOR_PICKUP: 3,
    REACHED_PICKUP:    4,
    HEADED_FOR_DROP:   5,
    COMPLETED:         6,
  });
  
  const TaskStatusByVal = Object.fromEntries(
    Object.entries(TaskStatus).map(([k, v]) => [v, k])
  );
  
  export function resolveStatus(raw) {
    if (raw == null) return null;
    return TaskStatusByVal[raw] ?? null;
  }
  
  export const isHeadingToPickup = v => v === TaskStatus.HEADED_FOR_PICKUP;
  export const isReachedPickup  = v => v === TaskStatus.REACHED_PICKUP;
  export const isHeadedForDrop  = v => v === TaskStatus.HEADED_FOR_DROP;
  export const isCompleted      = v => v === TaskStatus.COMPLETED;
  
  export const isArrivedOrBeyond = v => [
    TaskStatus.REACHED_PICKUP,
    TaskStatus.HEADED_FOR_DROP,
    TaskStatus.COMPLETED,
  ].includes(v);
  
  export const isLiveTrackingStatus = v =>
    v === TaskStatus.HEADED_FOR_PICKUP || v === TaskStatus.REACHED_PICKUP || v === TaskStatus.HEADED_FOR_DROP;

  export const isPrePickup = v => v === TaskStatus.UNASSIGNED || v === TaskStatus.ASSIGNED || v === TaskStatus.ACCEPTED;