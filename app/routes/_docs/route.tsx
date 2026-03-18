import { createFileRoute, Outlet } from "@tanstack/react-router"
import { RootProvider } from "fumadocs-ui/provider/tanstack"

export const Route = createFileRoute("/_docs")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <RootProvider
      theme={{ enabled: false }}
      search={{
        options: { api: "/docs/search" },
      }}
    >
      <Outlet />
    </RootProvider>
  )
}
