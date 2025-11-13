import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router"
import { LogOut, Settings } from "lucide-react"
import logoFCAGLP from "~/assets/fcaglp.png"
import logoIALP from "~/assets/logoialp.png"
import logoLIDI from "~/assets/logolidi.png"
import logoReTrOH from "~/assets/logoretroh.png"
import { Button, buttonVariants } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { authClient } from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import { cn } from "~/lib/utils"
import { AppBreadcrumbs } from "./-components/AppBreadcrumbs"

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  loader: async () => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({ to: "/login" })
    }
    return { session }
  },
})

function RouteComponent() {
  const { session } = Route.useLoaderData()
  const navigate = useNavigate()
  const userInfo = session.data?.user!
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

  const { mutate: signOut, isPending: _isSignOuting } = useMutation({
    mutationFn: async () => {
      try {
        const _ = await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              navigate({ to: "/login" })
            },
          },
        })
      } catch (error) {
        notifyError("Failed to sign out", error)
      }
    },
  })

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

          <div className="flex flex-row items-center gap-4">
            {/* <img
              src={userInfo.image ? userInfo.image : defaultImage}
              alt={userInfo.name}
              className="h-8 w-8 rounded-full border border-gray-500 bg-blue-100 object-cover"
            /> */}
            <div className="flex w-full flex-col ">
              <div className="flex flex-row justify-between">
                <label className="flex w-full justify-start text-gray-500">{userInfo.name}</label>
              </div>
              <label className="flex justify-start text-gray-400">{userInfo.email}</label>
            </div>
            <Link
              to="/settings"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "default",
                  className:
                    "m-0 flex cursor-pointer items-center justify-center border-none p-0 shadow-none",
                }),
              )}
            >
              <Settings className="flex h-full items-center" size={20} strokeWidth={1.5} />
            </Link>
            <Button
              onClick={() => signOut()}
              variant="outline"
              className="m-0 flex cursor-pointer items-center justify-center border-none p-0 shadow-none"
            >
              <LogOut size={22} strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col overflow-y-auto bg-accent">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
        <footer className="mt-12 flex items-center justify-evenly border-t p-4">
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
