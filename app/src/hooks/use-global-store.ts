import { globalStore, type GlobalStore } from "@/lib/store"
import { useShallow } from "zustand/shallow"

export const useGlobalStore = <U>(fn: (state: GlobalStore) => U): U => globalStore<U>(useShallow(fn))
