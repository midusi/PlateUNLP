import { useQuery } from "@tanstack/react-query"
import { getMetadata } from "."

export const useGetMetadataQuery = (
  params: { observat: string; object: string; dateObs: Date; ut: number },
  options?: {
    enabled?: boolean
  },
) => {
  return useQuery({
    queryKey: ["getMetadata"],
    queryFn: () => getMetadata(params),
    ...options,
  })
}
