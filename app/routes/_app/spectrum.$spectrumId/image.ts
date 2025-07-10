import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/spectrum/$spectrumId/image')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/spectrum/$spectrumId/image"!</div>
}
