import { useState } from "react"
import clsx from "clsx"

interface NewNavigationProgressBarProps {
    general: JSX.Element[]
    perSpectrum: JSX.Element[]
}

export function NewNavigationProgressBar({ general, perSpectrum }: NewNavigationProgressBarProps) {
    const [actual, setActual] = useState(0)
    const steps = [<div>Step 1</div>, <div>Step 2</div>, <div>Step 3</div>,
        , <div>Step 4</div>, <div>Step 5</div>, <div>Step 6</div>
    ];
    
    return <ProgressBarLine 
        steps={steps} 
        actualStep={actual} 
        setActualStep = {setActual}
    />
}

interface NavigationlineWithBoxProps {

}

function NavigationlineWithBox({}:NavigationlineWithBoxProps){
    return <></>
}

interface NavigationLineProps {
    steps: JSX.Element[];
    actualStep: number;
    setActualStep: React.Dispatch<React.SetStateAction<number>>;
}

function ProgressBarLine({ steps, actualStep, setActualStep }: ProgressBarLineProps) {
    return (
        <div className="flex items-center justify-between w-full">
            {steps.map((_: JSX.Element, index:number) => (
                <div key={index} className="flex items-center w-full last:w-auto">
                    return <span
                        className={clsx('rounded-full',
                            index < actualStep ? 'bg-blue-500' : 'bg-gray-500',
                            index == actualStep ? 'w-5 h-5' : 'w-4 h-4',
                            "cursor-pointer active:scale-90 active:bg-blue-700"
                        )}
                        onClick={ _ => setActualStep(index)}
                    />
                    {index < steps.length - 1 && (
                        <div className={clsx("h-1 flex-1", 
                            index < actualStep ? 'bg-blue-500' : 'bg-gray-500')} 
                        />
                    )}
                </div>
            ))}
        </div>
    );
}