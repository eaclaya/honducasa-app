'use client'
import { FilePond, registerPlugin } from 'react-filepond'
import 'filepond/dist/filepond.min.css'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Register the plugins
type FilePondFile = any
registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType)

interface FileUploaderProps {
    onSelectedFiles?: (files: File[]) => void
    mimeType?: string[]
}

export default function FileUploader({ onSelectedFiles, mimeType }: FileUploaderProps) {
  const [files, setFiles] = useState<FilePondFile[]>([])

  const handleUpdateFiles = (files: FilePondFile[]) => {
    setFiles(files)
    const newFiles = files.map(file => file.file)
    onSelectedFiles?.(newFiles)
  }

  const handleRemoveFile = (error: any, file: FilePondFile) => {
    if (error) {
      toast.error('Failed to remove image')
    }
    const newFiles = files.filter(item => item !== file.file)
    setFiles(newFiles)
    onSelectedFiles?.(newFiles)
  }

  return (
    <FilePond
        files={files}
        onupdatefiles={(files) => {
            handleUpdateFiles(files)
        }}
        allowMultiple={true}
        maxFiles={10}
        labelIdle="Drag & Drop your files or click to browse..."
        onremovefile={(error, file) => {
            handleRemoveFile(error, file)
        }}
        acceptedFileTypes={mimeType}
    />
    )
}