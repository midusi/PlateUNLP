import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "~/lib/utils"

const buttonVariants = cva(
  `
    inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap
    rounded-sm font-medium text-sm outline-none transition-all cursor-pointer
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    inner-icon:not-[[class*='size-']]:size-4 inner-icon:pointer-events-none inner-icon:shrink-0
  `,
  {
    variants: {
      variant: {
        default:
          "bg-olive-950 text-white shadow-xs hover:opacity-70 hover:text-amber-500 active:opacity-80 active:scale-[0.98]",
        destructive:
          "bg-red-600 text-white shadow-xs hover:bg-red-700 focus-visible:ring-red-600/20",
        outline:
          "border border-olive-300 bg-background shadow-xs hover:bg-olive-100 hover:text-orange-600",
        secondary: "bg-olive-200 text-olive-700 shadow-xs hover:bg-olive-100 hover:text-orange-600",
        ghost: "hover:bg-olive-100 hover:text-orange-600",
        link: "text-olive-950 underline-offset-4 hover:text-orange-600 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-inner-icon:px-3",
        sm: "h-8 gap-1.5 rounded-sm px-3 has-inner-icon:px-2.5",
        lg: "h-10 rounded-sm px-6 has-inner-icon:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  // biome-ignore lint/a11y/useButtonType: `type` will be passed in `props`
  render = <button />,
  className,
  variant,
  size,
  ...props
}: useRender.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  const element = useRender({
    render,
    props: mergeProps(
      {
        "data-slot": "button",
        className: cn(buttonVariants({ variant, size, className })),
      },
      props,
    ),
  })

  return element
}

export { Button, buttonVariants }
