import { Link, type LinkProps, useRouterState } from "@tanstack/react-router"
import { Fragment } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"

export type Breadcrumbs = { title: string; link: LinkProps }[]

export function AppBreadcrumbs() {
  const match = useRouterState({ select: (s) => s.matches.at(-1) })
  const breadcrumbs =
    match?.loaderData && "breadcrumbs" in match.loaderData ? match.loaderData.breadcrumbs : []

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map(({ title, link }, i, arr) => (
          <Fragment key={link.to}>
            {i === arr.length - 1 ? (
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink render={<Link {...link}>{title}</Link>} />
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
