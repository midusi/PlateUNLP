import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import logoFCAGLP from "~/assets/fcaglp.png"
import logoIALP from "~/assets/logoialp.png"
import logoLIDI from "~/assets/logolidi.png"
import logoReTrOH from "~/assets/logoretroh.png"
import { Separator } from "~/components/ui/separator"
import { AppBreadcrumbs } from "./-components/AppBreadcrumbs"

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex h-svh w-full flex-col">
      <header className="shrink-0 border-b text-sm">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link to="/">
              <span className="icon-[ph--shooting-star-duotone] size-5 min-w-5" />
            </Link>
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <AppBreadcrumbs />
          </div>
          <div className="flex items-center gap-2">Usuario</div>
        </div>
      </header>
      <div className="flex flex-1 flex-col overflow-y-auto bg-accent">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
        <footer className="mt-12 flex items-center justify-evenly border-t p-4">
          <a
            href="https://weblidi.info.unlp.edu.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 grayscale-100 transition-all duration-300 hover:opacity-100 hover:grayscale-0"
          >
            <img
              src={logoLIDI}
              alt="Logo del Instituto de Investigación en Informática LIDI"
              className="h-16"
            />
          </a>
          <a
            href="https://www.fcaglp.unlp.edu.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 grayscale-100 transition-all duration-300 hover:opacity-100 hover:grayscale-0"
          >
            <img
              src={logoFCAGLP}
              alt="Logo de la Facultad de Ciencias Astronómicas y Geofísicas"
              className="h-16"
            />
          </a>
          <a
            href="https://retroh.fcaglp.unlp.edu.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 grayscale-100 transition-all duration-300 hover:opacity-100 hover:grayscale-0"
          >
            <img
              src={logoReTrOH}
              alt="Logo del proyecto de Recuperación del Trabajo Observacional Histórico"
              className="h-16"
            />
          </a>
          <a
            href="https://ialp.fcaglp.unlp.edu.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 grayscale-100 transition-all duration-300 hover:opacity-100 hover:grayscale-0"
          >
            <img
              src={logoIALP}
              alt="Logo del Instituto de Astrofisica de La Plata (CONICET-UNLP)"
              className="h-16"
            />
          </a>
        </footer>
      </div>
    </div>
  )
}
