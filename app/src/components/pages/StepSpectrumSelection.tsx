import { ArrowDownTrayIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
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
            <div className="flex flex-col w-full" style={{ margin: "5% 20%" }}>
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
                        {spectrums.map((spectrum, _) => (
                            <tr key={spectrum.id} className="hover:bg-gray-50">
                                <td className="border px-4 py-2">{spectrum.id}</td>
                                <td className="border px-4 py-2">
                                    <img src={`/images/${spectrum.image}`} alt="Spectrum" className="w-full h-auto" />
                                </td>
                                <td className="border px-6 py-2">
                                    {`${spectrum.complete}/${totalSteps}`}
                                </td>
                                <td className="border px-4 py-2">
                                    {spectrum.complete / totalSteps === 1
                                        ? (
                                            <div className="text-green-300">
                                                Complete
                                            </div>
                                        )
                                        : (
                                            <div className="text-orange-300">
                                                Pending
                                            </div>
                                        )}
                                </td>
                                <td className="border-none px-4 py-2 text-center">
                                    <Button
                                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                                        onClick={() => { }}
                                    >
                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                    </Button>
                                </td>
                                <td className="border-none px-4 py-2 text-center">
                                    <Button
                                        className="p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                                        onClick={() => setSpecificObject(spectrum.id)}
                                    >
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
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
