import { useSyncExternalStore } from 'react'
import { runtimeStore } from './store'

/**
 * Subscribe to runtime changes (boot updates, lazy doc cache fills, etc.)
 * so React computations (like dependency state) can recompute deterministically.
 */
export function useFrappeRuntimeVersion() {
  return useSyncExternalStore(
    (listener) => runtimeStore.subscribe(listener),
    () => runtimeStore.getVersion(),
    () => 0
  )
}


