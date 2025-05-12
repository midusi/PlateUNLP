import { useId } from "react";

type CustomCheckboxProps = {
    label: string;
    checked?: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
};

export function CustomCheckbox({ label, checked, onChange, id = useId() }: CustomCheckboxProps) {
    return (
        <div className="flex items-center space-x-2">
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="peer"
            />
            <label
                htmlFor={id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
                {label}
            </label>
        </div>
    );
}
