import { Popover as PopoverPrimitive } from "@base-ui-components/react/popover"
import { cn } from "~/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    | "collisionAvoidance"
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "arrowPadding"
    | "anchor"
    | "collisionBoundary"
    | "collisionPadding"
    | "sticky"
    | "positionMethod"
    | "trackAnchor"
  >

function PopoverContent({
  // Positioner props
  collisionAvoidance = undefined,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  arrowPadding = 5,
  anchor = undefined,
  collisionBoundary = "clipping-ancestors",
  collisionPadding = 5,
  sticky = false,
  positionMethod = "absolute",
  trackAnchor = true,
  // Popup props
  className,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        collisionAvoidance={collisionAvoidance}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        arrowPadding={arrowPadding}
        anchor={anchor}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
        sticky={sticky}
        positionMethod={positionMethod}
        trackAnchor={trackAnchor}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[closed]:animate-out data-[open]:animate-in",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
