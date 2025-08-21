import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import logoFCAGLP from "~/assets/fcaglp.png"
import logoIALP from "~/assets/logoialp.png"
import logoLIDI from "~/assets/logolidi.png"
import logoReTrOH from "~/assets/logoretroh.png"
import { Separator } from "~/components/ui/separator"
import { authClient } from "~/lib/auth-client"
import { AppBreadcrumbs } from "../../_app/-components/AppBreadcrumbs"

export const Route = createFileRoute("/(auth)/settings")({
  component: RouteComponent,
})

function RouteComponent() {
  const userSession = authClient.useSession()
  return (
    <div className="flex h-full w-full flex-col">
      <header className="shrink-0 border-b text-sm">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link to="/">
              <span className="icon-[ph--shooting-star-duotone] size-5 min-w-5" />
            </Link>
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <AppBreadcrumbs />
          </div>
          <Link to="/settings">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 font-semibold text-white">
              {userSession.data?.user.name?.slice(0, 2).toUpperCase()}
            </div>
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col overflow-y-auto bg-accent">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
