import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "~/lib/utils"

function TooltipProvider({ ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

type TooltipContentProps = TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
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
    | "disableAnchorTracking"
  >

function TooltipContent({
  // Positioner props
  collisionAvoidance = undefined,
  align = "center",
  alignOffset = 0,
  side = "top",
  sideOffset = 4,
  arrowPadding = 5,
  anchor = undefined,
  collisionBoundary = "clipping-ancestors",
  collisionPadding = 5,
  sticky = false,
  positionMethod = "absolute",
  disableAnchorTracking = false,
  // Popup props
  className,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
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
        disableAnchorTracking={disableAnchorTracking}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "fade-in-0 zoom-in-95 data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--transform-origin) animate-in text-balance rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-xs data-[closed]:animate-out",
            className,
          )}
          {...props}
        >
          {children}
          {/* <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-primary fill-primary" /> */}
          <TooltipPrimitive.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=top]:bottom-[-8px] data-[side=right]:left-[-13px] data-[side=left]:rotate-90 data-[side=right]:-rotate-90 data-[side=top]:rotate-180">
            {/** biome-ignore lint/a11y/noSvgWithoutTitle: it's an arrow, not an icon */}
            <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
              <path
                d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V9H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
                className="fill-popover"
              />
              <path
                d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
                className="fill-border"
              />
            </svg>
          </TooltipPrimitive.Arrow>
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
