interface BBImageEditorProps {
    className: string
    src: string
}

export function BBImageEditor({ className, src }: BBImageEditorProps) {
    return <img className={className} src={src} />
}
