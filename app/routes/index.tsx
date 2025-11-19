import { createFileRoute, redirect } from "@tanstack/react-router"
import { authClient } from "~/lib/auth-client"

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: () => {
    throw redirect({ to: "/projects" })
  },
})

function RouteComponent() {
  console.log(authClient.useSession())
  return <p>nothing here</p>
}
