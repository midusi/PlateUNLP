import { Link } from "@tanstack/react-router"

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-2 p-2">
      <div className="text-olive-500">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-sm bg-olive-950 px-2 py-1 font-bold text-sm text-white uppercase hover:text-amber-500 hover:opacity-70"
        >
          Go back
        </button>
        <Link
          to="/"
          className="rounded-sm bg-olive-200 px-2 py-1 font-bold text-olive-700 text-sm uppercase hover:text-orange-600"
        >
          Start Over
        </Link>
      </p>
    </div>
  )
}
