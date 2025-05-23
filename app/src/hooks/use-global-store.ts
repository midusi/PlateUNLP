import { useShallow } from "zustand/shallow"
import type { GlobalStore } from "@/lib/store"
import { globalStore } from "@/lib/store"

export const useGlobalStore = <U>(fn: (state: GlobalStore) => U): U =>
  globalStore<U>(useShallow(fn))
