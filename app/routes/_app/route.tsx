import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router"
import { Hashvatar } from "hashvatar/react"
import logoFCAGLP from "~/assets/fcaglp.png"
import logoIALP from "~/assets/logoialp.png"
import logoLIDI from "~/assets/logolidi.png"
import logoReTrOH from "~/assets/logoretroh.png"
import { Button, buttonVariants } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { authClient } from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import { cn } from "~/lib/utils"
import { getSession } from "./-actions/get-session"
import { AppBreadcrumbs } from "./-components/AppBreadcrumbs"

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  loader: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: "/login" })
    }
    return { session }
  },
})

function RouteComponent() {
  const { session } = Route.useLoaderData()
  const navigate = useNavigate()
  const userInfo = session!.user
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
      <header className="shrink-0 border-olive-300 border-b bg-white text-sm">
        <div className="mx-auto flex h-16 w-full max-w-9/12 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-olive-950 transition-colors hover:text-orange-600">
              <span className="icon-[ph--shooting-star-duotone] size-5 min-w-5" />
            </Link>
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <AppBreadcrumbs />
          </div>

          <div className="flex flex-row items-center gap-4">
            {userInfo.image ? (
              <img
                src={userInfo.image}
                alt={userInfo.name}
                className="h-8 w-8 rounded-full border border-olive-300 bg-olive-100 object-cover"
              />
            ) : (
              <Hashvatar
                hash={userInfo.email}
                mode="dither"
                size={32}
                className="h-8 w-8 rounded-full border border-olive-300"
              />
            )}
            <div className="flex w-full flex-col">
              <div className="flex flex-row justify-between">
                <label className="flex w-full justify-start text-olive-700">
                  {userInfo.username || userInfo.name}
                </label>
              </div>
              <label className="flex justify-start text-olive-400">{userInfo.email}</label>
            </div>
            {userInfo.role === "admin" && (
              <Link
                to="/admin"
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "default",
                    className:
                      "m-0 flex cursor-pointer items-center justify-center border-none p-0 shadow-none",
                  }),
                )}
              >
                <span className="icon-[ph--user-gear-bold] size-5" />
              </Link>
            )}
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
              <span className="icon-[ph--gear] size-5" />
            </Link>
            <Button
              onClick={() => signOut()}
              variant="outline"
              className="m-0 flex cursor-pointer items-center justify-center border-none p-0 shadow-none"
            >
              <span className="icon-[ph--sign-out] size-5" />
            </Button>
          </div>
        </div>
      </header>
      <div className="flex w-full flex-1 flex-col overflow-y-auto bg-accent">
        <main className={cn("mx-auto flex w-full flex-1 flex-col gap-4 p-4", "max-w-9/12")}>
          <Outlet />
        </main>
        <footer className="mt-12 flex items-center justify-evenly border-olive-300 border-t p-4">
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
