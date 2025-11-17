import { Select as SelectPrimitive } from "@base-ui-components/react/select"
import { cn } from "~/lib/utils"

function Select<Value>(props: SelectPrimitive.Root.SingleProps<Value>): React.JSX.Element
function Select<Value>(props: SelectPrimitive.Root.MultipleProps<Value>): React.JSX.Element
function Select<Value>(
  props: SelectPrimitive.Root.SingleProps<Value> | SelectPrimitive.Root.MultipleProps<Value>,
): React.JSX.Element {
  if (props.multiple) {
    return <SelectPrimitive.Root<Value> {...props} multiple={true} data-slot="select" />
  } else {
    return <SelectPrimitive.Root<Value> {...props} multiple={false} data-slot="select" />
  }
}

function SelectGroup({ ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({ ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:hover:bg-input/50",
        "not-[[data-filled]]:text-muted-foreground",
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        "inner-icon:pointer-events-none inner-icon:not-[[class*='size-']]:size-4 inner-icon:shrink-0 inner-icon:not-[[class*='text-']]:text-muted-foreground",
        size === "sm" && "h-8",
        size === "default" && "h-9",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <span className="icon-[ph--caret-down-bold] size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

type SelectContentProps = SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
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

function SelectContent({
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
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
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
        <SelectScrollUpArrow />
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative origin-(--transform-origin) overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[closed]:animate-out data-[open]:animate-in",
            "data-[side=left]:-translate-x-1 data-[side=top]:-translate-y-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1",
            "h-(--anchor-height) max-h-(--available-height) w-full min-w-(--trigger-width) scroll-my-1 p-1",
            className,
          )}
          {...props}
        />
        <SelectScrollDownArrow />
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-muted-foreground text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        "inner-icon:pointer-events-none inner-icon:not-[[class*='size-']]:size-4 inner-icon:shrink-0 inner-icon:not-[[class*='text-']]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <span className="icon-[ph--check-bold] size-4 shrink-0 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1 pointer-events-none my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpArrow({ className, ...props }: SelectPrimitive.ScrollUpArrow.Props) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <span className="icon-[ph--caret-up-bold] size-4" />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownArrow({ className, ...props }: SelectPrimitive.ScrollDownArrow.Props) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <span className="icon-[ph--caret-down-bold] size-4" />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownArrow,
  SelectScrollUpArrow,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
