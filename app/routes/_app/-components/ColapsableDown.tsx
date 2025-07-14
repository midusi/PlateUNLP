import { Collapsible } from "@base-ui-components/react/collapsible";
import { type PropsWithChildren, useState } from "react";

export function ColapsableDown({
	children,
	title,
}: PropsWithChildren<{ title: string }>) {
	const [open, setOpen] = useState(true);

	return (
		<Collapsible.Root
			open={open}
			onOpenChange={setOpen}
			className="flex w-full flex-col justify-center text-gray-900"
		>
			<div className="mx-6 flex items-center">
				<span className="flex-grow text-lg font-semibold text-gray-800">
					{title}
				</span>
				<Collapsible.Trigger className="group flex justify-center bg-gray-100 px-2 text-sm font-medium">
					<ChevronIcon className="flex justify-center size-3 transition-all ease-out group-data-[panel-open]:-rotate-90 group-hover:scale-120 group-hover:text-blue-600 stroke-current group-hover:text-gray-800" />
				</Collapsible.Trigger>
			</div>
			<Collapsible.Panel className="mt-4 flex h-[var(--collapsible-panel-height)] flex-col justify-end overflow-hidden text-sm transition-all ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
				{children}
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}

export function ChevronIcon(props: React.ComponentProps<"svg">) {
	return (
		<svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
			<title>Arrow pointing left</title>
			<path d="M6.5 1L2.5 5L6.5 9" stroke="currentcolor" />
		</svg>
	);
}
