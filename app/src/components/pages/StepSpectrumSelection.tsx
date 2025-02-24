import { Button } from "../atoms/button"

interface StepSpectrumSelectionProps {
    setSpecificObject: React.Dispatch<React.SetStateAction<string | null>>
}

export function StepSpectrumSelection({ setSpecificObject }: StepSpectrumSelectionProps) {
    const spectrums = [
        { id: "Pla0#Spec1", image: null, complete: 3 },
        { id: "Pla0#Spec2", image: null, complete: 0 },
        { id: "Pla0#Spec3", image: null, complete: 0 },
    ]
    const totalSteps = 5
    return (
        <>
            <div className="flex flex-col w-full" style={{ margin: "5% 20%" }}>
                <table className="min-w-full border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="border px-4 py-2 whitespace-nowrap">Id</th>
                            <th className="border px-4 py-2 w-full">Image</th>
                            <th className="border px-4 py-2 whitespace-nowrap">Steps</th>
                            <th className="border px-4 py-2 whitespace-nowrap">State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {spectrums.map((spectrum, _) => (
                            <tr key={spectrum.id} className="hover:bg-gray-50">
                                <td className="border px-4 py-2">{spectrum.id}</td>
                                <td className="border px-4 py-2">{spectrum.image}</td>
                                <td className="border px-4 py-2">
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
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="flex justify-center">
                    Elije un espectro
                    {" >: )"}
                </p>
                <Button
                    onClick={() => setSpecificObject("Spectrum#1")}
                >
                    Set Spectrum = Spectrum#1
                </Button>
                <Button
                    onClick={() => setSpecificObject(null)}
                    className="bg-red-400"
                >
                    Delete Selected
                </Button>
            </div>
        </>
    )
}
