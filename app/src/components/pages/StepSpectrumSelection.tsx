import { Button } from "../atoms/button"

interface StepSpectrumSelectionProps {
    setSpecificObject: React.Dispatch<React.SetStateAction<string | null>>
}

export function StepSpectrumSelection({ setSpecificObject }: StepSpectrumSelectionProps) {
    return (
        <div className="flex flex-col">
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
    )
}
