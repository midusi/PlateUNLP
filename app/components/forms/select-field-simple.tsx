import { Select } from "@base-ui-components/react/select";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { useStore } from "@tanstack/react-form";
import { useMemo } from "react";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "~/components/ui/field";
import { useFieldContext } from "~/hooks/use-app-form-context";
import type { Input } from "../ui/input";

type SelectFieldSimpleProps = {
	className?: string;
	label?: React.ReactNode;
	description?: React.ReactNode;
	options: OptionFormat[];
} & Pick<React.ComponentProps<typeof Input>, "placeholder">;

type ValueType = string;
type OptionFormat = {
	label: string;
	value: ValueType;
};
export function SelectFieldSimple({
	className,
	label,
	description,
	options,
}: SelectFieldSimpleProps) {
	const field = useFieldContext<ValueType>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	const selectedValue = useMemo(
		() => options.find((o) => o.value === field.state.value) || null,
		[options, field.state.value],
	);
	return (
		<Field className={className}>
			{label && <FieldLabel>{label}</FieldLabel>}
			<Select.Root
				items={options}
				value={field.state.value ?? ""}
				onValueChange={(val) => field.handleChange(val)}
			>
				<Select.Trigger className="flex h-10 min-w-36 items-center justify-between gap-3 rounded-md border border-gray-200 pr-3 pl-3.5 text-base text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100 cursor-default">
					<Select.Value />
					<Select.Icon className="flex">
						<ChevronUpDownIcon />
					</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Positioner
						className="outline-none select-none z-10"
						sideOffset={8}
					>
						<Select.ScrollUpArrow className="top-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
						<Select.Popup className="group max-h-[var(--available-height)] origin-[var(--transform-origin)] overflow-y-auto bg-clip-padding rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none data-[side=none]:scroll-py-5 dark:shadow-none dark:outline-gray-300">
							{options.map(({ label, value }) => (
								<Select.Item
									key={label}
									value={value}
									className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 group-data-[side=none]:scroll-my-1 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900 pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem]"
								>
									<Select.ItemIndicator className="col-start-1">
										<CheckIcon className="size-3" />
									</Select.ItemIndicator>
									<Select.ItemText className="col-start-2">
										{label}
									</Select.ItemText>
								</Select.Item>
							))}
						</Select.Popup>
						<Select.ScrollDownArrow className="bottom-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
					</Select.Positioner>
				</Select.Portal>
			</Select.Root>

			{description && <FieldDescription>{description}</FieldDescription>}
			{errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
		</Field>
	);
}
