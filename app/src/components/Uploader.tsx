import type { ChangeEvent } from "react"
import { useState } from "react"
import { AiFillFileImage } from "react-icons/ai"
import { MdCloudUpload, MdDelete } from "react-icons/md"
import "@/components/css/Uploader.css"

interface UploaderProps {
    accept: string
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
    showInfoDeleteRow: boolean
}

export function Uploader({ accept = "image/*", onChange, showInfoDeleteRow = true }: UploaderProps) {
    const [file, setFile] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string>("No selected file")
    const [isDragging, setIsDragging] = useState<boolean>(false)

    function handleFileUpload(file: File): void {
        setFileName(file.name)
        setFile(URL.createObjectURL(file))
    };

    function handleDrop(event: React.DragEvent<HTMLFormElement>): void {
        event.preventDefault()
        setIsDragging(false)

        const files = event.dataTransfer.files
        if (files && files[0]) {
            handleFileUpload(files[0])
            const fakeEvent = {
                target: { files } as unknown as HTMLInputElement,
            } as React.ChangeEvent<HTMLInputElement> // Simular un ChangeEvent<HTMLInputElement>
            onChange(fakeEvent)
        }
    }

    return (
        <div className="uploader-container">
            <form
                className={`uploader-form ${isDragging ? "dragging" : ""}`}
                onClick={() => (document.querySelector(".input-field") as HTMLElement).click()}
                onDragOver={(event) => {
                    if (!file) {
                        event.preventDefault()
                        setIsDragging(true)
                    }
                }}
                onDragEnter={(event) => {
                    if (!file) {
                        event.preventDefault()
                        setIsDragging(true)
                    }
                }}
                onDragLeave={() => { !file && setIsDragging(false) }}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept={accept}
                    className="input-field"
                    hidden
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const { files } = event.target
                        if (files && files[0]) {
                            onChange(event)
                            handleFileUpload(files[0])
                        }
                    }}
                />
                {file
                    ? <img src={file} width={100} height={100} alt={fileName}></img>
                    : (
                        <>
                            <MdCloudUpload color="#1475cf" size={100} />
                            <p>{isDragging ? "Drop your file here" : "Browse files to upload or drag them here"}</p>
                        </>
                    )}
            </form>
            {showInfoDeleteRow && (
                <section className="uploaded-row">
                    <AiFillFileImage color="#1475cf" />
                    <span className="uploaded-content">
                        {fileName}
                        <MdDelete onClick={() => {
                            setFileName("No selected file")
                            setFile(null)
                        }}
                        />
                    </span>
                </section>
            )}
        </div>
    )
}
