import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: () => {
    throw redirect({ to: "/projects" })
  },
})

function RouteComponent() {
  return <p>nothing here</p>
}
