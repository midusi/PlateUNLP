import { createFileRoute, redirect } from "@tanstack/react-router"
import {authClient} from "~/lib/auth-client"

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: () => {
    return redirect({ to: "/login" })
  },
})

function RouteComponent() {
  console.log(authClient.useSession())
  return <p>nothing here</p>
}
