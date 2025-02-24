import { ArrowDownTrayIcon, ArrowRightIcon, PencilIcon } from "@heroicons/react/24/outline"
import clsx from "clsx"
import { Tooltip } from "react-tooltip"
import { Button } from "../atoms/button"

interface StepSpectrumSelectionProps {
    setSpecificObject: React.Dispatch<React.SetStateAction<string | null>>
}

export function StepSpectrumSelection({ setSpecificObject }: StepSpectrumSelectionProps) {
    const spectrums = [
        { id: "Plate0#Spectrum1", image: "spectrumExample.png", complete: 5 },
        { id: "Plate0#Spectrum2", image: "spectrumExample.png", complete: 3 },
        { id: "Plate0#Spectrum3", image: "spectrumExample.png", complete: 0 },
    ]
    const totalSteps = 5
    return (
        <>
            <div className="flex flex-col w-full" style={{ margin: "5% 10%" }}>
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-300 text-left">
                            <th className="border px-4 py-2 whitespace-nowrap">Id</th>
                            <th className="border px-4 py-2 w-full">Image</th>
                            <th className="border px-4 py-2 whitespace-nowrap">Steps</th>
                            <th className="border px-4 py-2 whitespace-nowrap">State</th>
                            <th className="hidden">Download</th>
                            <th className="hidden">Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {spectrums.map((spectrum, _) => {
                            const complete: boolean = spectrum.complete / totalSteps === 1
                            return (
                                <tr key={spectrum.id} className="hover:bg-gray-50">
                                    <td className="border px-4 py-2">{spectrum.id}</td>
                                    <td className="border px-4 py-2">
                                        <img src={`/images/${spectrum.image}`} alt="Spectrum" className="w-full h-auto" />
                                    </td>
                                    <td className="border px-6 py-2">
                                        {`${spectrum.complete}/${totalSteps}`}
                                    </td>
                                    <td className="border px-4 py-2">
                                        {complete
                                            ? (
                                                <div className="text-green-400">
                                                    Complete
                                                </div>
                                            )
                                            : (
                                                <div className="text-orange-400">
                                                    Pending
                                                </div>
                                            )}
                                    </td>
                                    <td className="border-none px-4 py-2 text-center">
                                        <Button
                                            data-tooltip-id="download-tooltip"
                                            className={clsx(
                                                "p-2",
                                                "bg-blue-500 text-white rounded hover:bg-blue-600 transition",
                                            )}
                                            onClick={() => { }}
                                            disabled={!complete}
                                        >
                                            <ArrowDownTrayIcon className="w-5 h-5" />
                                            <Tooltip
                                                id="download-tooltip"
                                                place="right-start"
                                                noArrow
                                                delayShow={300}
                                                content="Download"
                                                className="!text-[10px] !px-1 !py-0 !rounded-none !border !border-black !bg-white !text-black !shadow-md"
                                            />
                                        </Button>
                                    </td>
                                    <td className="border-none px-4 py-2 text-center">
                                        <Button
                                            className={clsx(
                                                "p-2 rounded ",
                                                complete
                                                    ? "bg-green-500 hover:bg-green-400"
                                                    : "bg-orange-500 hover:bg-orange-400",
                                                "text-white  transition",
                                            )}
                                            data-tooltip-id={complete ? "edit-tooltip" : "complete-tooltip"}
                                            onClick={() => setSpecificObject(spectrum.id)}
                                        >
                                            {complete
                                                ? <PencilIcon className="w-5 h-5" />
                                                : <ArrowRightIcon className="w-5 h-5" />}

                                            <Tooltip
                                                id={complete ? "edit-tooltip" : "complete-tooltip"}
                                                place="right-start"
                                                noArrow
                                                delayShow={300}
                                                className="!text-[10px] !px-1 !py-0 !rounded-none !border !border-black !bg-white !text-black !shadow-md"
                                                content={complete ? "Edit" : "Complete"}
                                            />
                                        </Button>
                                    </td>

                                </tr>
                            )
                        },
                        )}
                    </tbody>
                </table>
                <Button
                    onClick={() => setSpecificObject(null)}
                    className="bg-red-400 mt-20"
                >
                    Delete Selected
                </Button>
            </div>
        </>
    )
}
