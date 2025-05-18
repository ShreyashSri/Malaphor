"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, UploadCloud } from "lucide-react"

interface TerraformUploadProps {
  onUpload: (file: File) => Promise<void>
}

export function TerraformUpload({ onUpload }: TerraformUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    try {
      setIsUploading(true)
      await onUpload(file)
    } catch (err) {
      setError("Failed to upload and analyze Terraform file")
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="terraform-file">Terraform File</Label>
        <Input 
          id="terraform-file" 
          type="file" 
          accept=".tf,.tf.json" 
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={handleSubmit}
        disabled={!file || isUploading}
      >
        {isUploading ? "Analyzing..." : (
          <>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload & Analyze
          </>
        )}
      </Button>
    </div>
  )
}