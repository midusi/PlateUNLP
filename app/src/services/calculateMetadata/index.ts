import apiClient from "../api"
import type { IApiResponse } from "../api/types"
import type { IMetadataResponse } from "./types"

export const getMetadata = async (requiredData: {
  observat: string
  object: string
  dateObs: Date
  ut: number
}): Promise<IApiResponse<IMetadataResponse>> => {
  return (
    await apiClient.get<IApiResponse<IMetadataResponse>>(
      `observat=${requiredData.observat}/object=${requiredData.object}/dateobs=${requiredData.dateObs}/ut=${requiredData.ut}`,
    )
  ).data
}
