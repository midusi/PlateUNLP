import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import { project, userToProject } from "~/db/schema"
import { log } from "~/lib/log"

export const addProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      usersRoles: z.array(
        z.object({
          id: z.string().min(1),
          role: z.enum(["admin", "editor", "viewer"]),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    const { name, usersRoles } = data
    const [newProject] = await db.insert(project).values({ name }).returning({
      id: project.id,
      name: project.name,
    })

    const roles = usersRoles.map((u) => ({
      userId: u.id,
      projectId: newProject.id,
      role: u.role,
    }))

    if (roles.length > 0) {
      await db.insert(userToProject).values(roles)
    }

    log().set({ project: { id: newProject.id, name: newProject.name, members: usersRoles.length } })
    log().info("project created")
    return newProject
  })
