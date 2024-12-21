import { ReferenceLampRange } from "./ReferenceLampRange"

export function ReferenceLampRangeUI() {
    return (
        <div className="flex w-full overflow-hidden">
            <div className="flex-8" style={{ width: `80%` }}>
                <ReferenceLampRange />
            </div>
            <div className=" bg-green-100 p-4 flex-2 w-[200px]">
                Botones min y max
            </div>
        </div>
    )
}
