import type { SpectrumData } from "@/interfaces/ProcessInfoForm"
import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
import { cropImages } from "@/lib/cropImage"
import { totalStepsCompleted } from "@/lib/utils"
import { ArrowDownTrayIcon, ArrowRightIcon, PencilIcon } from "@heroicons/react/24/outline"
import clsx from "clsx"
import { useEffect, useState } from "react"
import { Tooltip } from "react-tooltip"
import { Button } from "../atoms/button"

export function StepSpectrumSelection({ index: stepIndex, processInfo }: StepProps) {
  const stepsNum = processInfo.processingStatus.specificSteps.length
  const spectrums: SpectrumData[] = processInfo.data.spectrums
  const [setSpecificObject, setActualStep] = useGlobalStore(s => [
    s.setSelectedSpectrum,
    s.setActualStep,
  ])
  const [croppedImages, setCroppedImages] = useState<string[] | null>(null)
  useEffect(() => {
    cropImages(
      processInfo.data.plate.scanImage!,
      spectrums.map(s => s.spectrumBoundingBox),
    ).then(setCroppedImages)
  }, [processInfo.data.plate.scanImage, spectrums])

  return (
    <>
      <div className="flex flex-col w-full" style={{ margin: "5% 10%" }}>
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-300 text-left">
              <th className="border px-4 py-2 whitespace-nowrap">Name</th>
              <th className="border px-4 py-2 w-full">Image</th>
              <th className="border px-4 py-2 whitespace-nowrap">Steps</th>
              <th className="border px-4 py-2 whitespace-nowrap">State</th>
              <th className="hidden">Download</th>
              <th className="hidden">Edit</th>
            </tr>
          </thead>
          <tbody>
            {spectrums.map((spectrum, index) => {
              const completedSteps = totalStepsCompleted(index, processInfo.processingStatus.specificSteps)
              const complete: boolean = completedSteps / stepsNum === 1
              return (
                <tr key={spectrum.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{spectrum.name}</td>
                  <td className="border px-4 py-2">
                    {croppedImages && <img src={croppedImages[index]} alt={spectrum.name} className="w-full h-auto" />}
                  </td>
                  <td className="border px-6 py-2">
                    {`${completedSteps}/${stepsNum}`}
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
                      onClick={() => {
                        const sharedMetadata = processInfo.data.plate.sharedMetadata
                        const scanImage = processInfo.data.plate.scanImage
                        const data = {
                          ...processInfo.data.spectrums[index],
                          sharedMetadata,
                          scanImage
                        };
                        const jsonString = JSON.stringify(data, null, 2);
                        const blob = new Blob([jsonString], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `plate_${index}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}

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
                      onClick={() => {
                        setSpecificObject(index)
                        setActualStep(stepIndex + 1)
                      }}
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
