import { useState } from "react"
import { AiFillFileImage } from "react-icons/ai"
import { MdCloudUpload, MdDelete } from "react-icons/md"
import "@/components/css/Uploader.css"

export function Uploader() {
    const [file, setFile] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string>("No selected file")

    return (
        <div>
            <form onClick={() => (document.querySelector(".input-field") as HTMLElement).click()}>
                <input
                    type="file"
                    accept="image/*"
                    className="input-field"
                    hidden
                    onChange={({ target: { files } }) => {
                        files && files[0] && setFileName(files[0].name)
                        if (files) {
                            setFile(URL.createObjectURL(files[0]))
                        }
                    }}
                />
                {file
                    ? <img src={file} width={100} height={100} alt={fileName}></img>
                    : (
                        <>
                            <MdCloudUpload color="#1475cf" size={100} />
                            <p>Browse files to upload</p>
                        </>
                    )}
            </form>
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
        </div>
    )
}
