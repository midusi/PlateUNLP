import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

export const getMaterialData = createServerFn()
  .inputValidator(z.object({ materialName: z.string() }))
  .handler(async ({ data }) => {
    const material = await db.query.material.findFirst({
      where: (material, { eq }) => eq(material.name, data.materialName),
      columns: {
        id: true,
        name: true,
        arr: true,
      },
    })
    return material
  })

export const getMaterialDataQueryOptions = (materialName: string) =>
  queryOptions({
    queryKey: ["get", "materialData", materialName],
    queryFn: () => getMaterialData({ data: { materialName } }),
  })
