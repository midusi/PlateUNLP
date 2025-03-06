import type { SpectrumData } from "@/interfaces/ProcessInfoForm"
import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
import { ArrowDownTrayIcon, ArrowRightIcon, PencilIcon } from "@heroicons/react/24/outline"
import clsx from "clsx"
import { Tooltip } from "react-tooltip"
import { Button } from "../atoms/button"

export function StepSpectrumSelection({ index: stepIndex, processInfo }: StepProps) {
  const stepsNum = processInfo.perSpectrum.length
  const spectrums: SpectrumData[] = processInfo.spectrums
  const [setSpecificObject, setActualStep] = useGlobalStore(s => [
    s.setSelectedSpectrum,
    s.setActualStep,
  ])

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
              const complete: boolean = spectrum.complete / stepsNum === 1
              return (
                <tr key={spectrum.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{spectrum.name}</td>
                  <td className="border px-4 py-2">
                    <img src={spectrum.image} alt={spectrum.name} className="w-full h-auto" />
                  </td>
                  <td className="border px-6 py-2">
                    {`${spectrum.complete}/${stepsNum}`}
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
