import browserCollections from "fumadocs-mdx:collections/browser"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { formatDate } from "date-fns"
import { useFumadocsLoader } from "fumadocs-core/source/client"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import defaultMdxComponents from "fumadocs-ui/mdx"
import { source } from "~/lib/source"

import docsCss from "~/styles/docs.css?url"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "PlateUNLP",
    },
    githubUrl: "https://github.com/midusi/PlateUNLP",
    themeSwitch: { enabled: false },
  }
}

export const Route = createFileRoute("/docs/$")({
  head: () => ({
    links: [{ rel: "stylesheet", href: docsCss }],
  }),
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? []
    const data = await serverLoader({ data: slugs })
    await clientLoader.preload(data.path)
    return data
  },
})

const serverLoader = createServerFn({
  method: "GET",
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs)
    if (!page) throw notFound()

    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree()),
    }
  })

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, lastModified, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={{
              ...defaultMdxComponents,
            }}
          />
        </DocsBody>
        <hr />
        <p className="text-fd-muted-foreground text-sm">
          <span rel="license">
            This work is licensed under{" "}
            <a
              target="_blank"
              rel="license noopener noreferrer"
              href="http://creativecommons.org/licenses/by-sa/4.0/"
              className="underline"
            >
              CC BY-SA 4.0
            </a>
            .
          </span>{" "}
          {lastModified && (
            <span>
              Last updated on{" "}
              <time dateTime={lastModified.toISOString()}>
                {formatDate(lastModified, "MMMM dd, yyyy")}
              </time>
            </span>
          )}
        </p>
      </DocsPage>
    )
  },
})

function Page() {
  const data = Route.useLoaderData()
  const { pageTree } = useFumadocsLoader(data)
  const Content = clientLoader.getComponent(data.path)

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Content />
    </DocsLayout>
  )
}
