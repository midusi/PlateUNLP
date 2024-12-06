import "./css/ProgressBar.css"

interface ProgressBarProps {
    value: number
    max: number
}

function ProgressBar({ value, max }: ProgressBarProps) {
    return (
        <div className="progress-bar">
            <div className="progress-bar-completed" style={{ width: `${(value / max) * 100}%` }}>
            </div>
        </div>
    )
}

export function NavigationProgressBar() {
    return <ProgressBar value={2} max={3} />
}
