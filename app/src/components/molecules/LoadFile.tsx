import type { ChangeEvent } from "react"

import { Uploader } from "@/components/molecules/Uploader"

import { useEffect, useState } from "react"

type LoadingState = "waiting" | "processing" | "finished" | "error"

export function LoadFile({ onSelect }: { onSelect: (file: string) => void }) {
    const [loadingState, setLoadingState] = useState<LoadingState>("waiting")
    const [file, setFile] = useState<string | null>(null)

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setLoadingState("processing")
            const file = event.target.files[0]
            if (!["image/png", "image/jpeg"].includes(file.type)) {
                setLoadingState("error")
                return
            }
            setFile(URL.createObjectURL(file))
            setLoadingState("finished")
        }
    }

    useEffect(() => {
        if (file != null)
            onSelect(file)
    }, [file, onSelect])

    return (
        <div className="w-full p-6">
            {loadingState === "waiting"
                && <Uploader accept=".png,.jpg" onChange={handleFileChange} showInfoDeleteRow={false} />}
            {loadingState === "error" && <p>Error loading image. Please try again.</p>}
            {loadingState === "processing" && <p>Cargando contenido...</p>}
        </div>
    )
}
