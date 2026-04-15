export function Pending() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-olive-200">
      <div className="h-full w-1/3 animate-[progress_1.5s_ease-in-out_infinite] bg-orange-600" />
    </div>
  )
}
