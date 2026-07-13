// Helpers that keep tasks/notes sync-friendly: every change stamps
// `updatedAt` (so last-write-wins merging works) and deletes become
// tombstones (`deleted: true`) instead of removing the row, so a delete on
// one device propagates to the others.

type Item = { id: string; updatedAt?: number; deleted?: boolean }

/** Only the items a user should see (drops tombstones). */
export function visible<T extends Item>(list: T[]): T[] {
  return list.filter((i) => !i.deleted)
}

/** Apply changes to one item by id, stamping updatedAt. */
export function patchItem<T extends Item>(
  list: T[],
  id: string,
  changes: Partial<T>,
): T[] {
  return list.map((i) =>
    i.id === id ? { ...i, ...changes, updatedAt: Date.now() } : i,
  )
}

/** Mark an item deleted (tombstone) rather than removing it. */
export function softDelete<T extends Item>(list: T[], id: string): T[] {
  return list.map((i) =>
    i.id === id ? { ...i, deleted: true, updatedAt: Date.now() } : i,
  )
}
