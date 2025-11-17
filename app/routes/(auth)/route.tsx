import { createFileRoute, Outlet } from "@tanstack/react-router"
import logoFCAGLP from "~/assets/fcaglp.png"
import logoIALP from "~/assets/logoialp.png"
import logoLIDI from "~/assets/logolidi.png"
import logoReTrOH from "~/assets/logoretroh.png"

export const Route = createFileRoute("/(auth)")({
  component: RouteComponent,
})

function RouteComponent() {
  const logos = [
    {
      href: "https://weblidi.info.unlp.edu.ar/",
      src: logoLIDI,
      alt: "Logo del Instituto de Investigación en Informática LIDI (III-LIDI)",
    },
    {
      href: "https://www.fcaglp.unlp.edu.ar/",
      src: logoFCAGLP,
      alt: "Logo de la Facultad de Ciencias Astronómicas y Geofísicas (FCAGLP)",
    },
    {
      href: "https://retroh.fcaglp.unlp.edu.ar/",
      src: logoReTrOH,
      alt: "Logo del proyecto de Recuperación del Trabajo Observacional Histórico (ReTrOH)",
    },
    {
      href: "https://ialp.fcaglp.unlp.edu.ar/",
      src: logoIALP,
      alt: "Logo del Instituto de Astrofisica de La Plata (CONICET-UNLP)",
    },
  ]
  return (
    <div className="flex h-svh w-full flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto bg-accent">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
        <footer className="mt-10 flex items-center justify-evenly border-t p-4">
          {logos.map(({ href, src, alt }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-50 grayscale-100 transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            >
              <img src={src} alt={alt} className="h-16" />
            </a>
          ))}
        </footer>
      </div>
    </div>
  )
}
