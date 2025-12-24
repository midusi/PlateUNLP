/// <reference types="vite/client" />

import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { RootProvider as FumadocsProvider } from "fumadocs-ui/provider/tanstack"
import type * as React from "react"
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary"
import { Pending } from "~/components/Pending"
import { Toaster } from "~/components/ui/toast"
import { seo } from "~/lib/seo"

import appCss from "~/styles/app.css?url"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...seo({ title: "PlateUNLP" }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    )
  },
  component: RootComponent,
})

function RootComponent() {
  const isShell = useRouter().isShell()

  if (isShell) {
    return (
      <RootDocument>
        <div className="root">
          <Pending />
        </div>
      </RootDocument>
    )
  }

  return (
    <RootDocument>
      <div className="root">
        <Outlet />
      </div>
      <Toaster />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <FumadocsProvider
          theme={{
            enabled: false,
          }}
          search={{
            options: { api: "/docs/search" },
          }}
        >
          {children}
        </FumadocsProvider>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
