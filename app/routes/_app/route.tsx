import { createFileRoute, Outlet } from "@tanstack/react-router"
import { Separator } from "~/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { AppBreadcrumbs } from "./-components/AppBreadcrumbs"
import { AppSidebar } from "./-components/AppSidebar"

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <AppBreadcrumbs />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </main>
        <footer className="mt-8 mb-4 text-xs italic text-center text-muted-foreground">
          Copyright @{new Date().getFullYear()} III-LIDI, Facultad de Informática, Universidad
          Nacional de la Plata
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
