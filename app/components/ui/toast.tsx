import { Toast } from "@base-ui/react/toast"
import { toastManager } from "~/lib/notifications"

function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <Toast.Portal>
        <Toast.Viewport className="fixed top-auto right-[1rem] bottom-[1rem] mx-auto flex w-[250px] sm:right-[2rem] sm:bottom-[2rem] sm:w-[300px]">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

function ToastList() {
  const { toasts } = Toast.useToastManager()

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      // Too many classes, there are inside utils.css
      className="toast-item"
    >
      <Toast.Title />
      <Toast.Description />
      <Toast.Close aria-label="Close">
        <span className="icon-[ph--x-bold] pointer-events-none size-4 shrink-0" />
      </Toast.Close>
    </Toast.Root>
  ))
}

export { Toaster, toastManager }
