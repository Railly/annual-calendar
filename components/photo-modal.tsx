"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, ImageIcon, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerDescription } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

interface PhotoModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  existingPhoto?: string
  onSave: (photoUrl: string) => void
  onRemove?: () => void
}

export function PhotoModal({ isOpen, onClose, date, existingPhoto, onSave, onRemove }: PhotoModalProps) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 640px)")

  const formattedDate = date?.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const year = date?.getFullYear()
  const dateKey = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : ""

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || isSaving) return

    setIsSaving(true)
    try {
      if (selectedFile) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("date", dateKey)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        setIsUploading(false)
        onSave(data.url)
      } else if (preview) {
        onSave(preview)
      }
      onClose()
    } catch (error) {
      console.error("Error uploading photo:", error)
      setIsUploading(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    if (onRemove && !isDeleting) {
      setIsDeleting(true)
      try {
        await onRemove()
        onClose()
      } catch (error) {
        console.error("Error removing photo:", error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleClearPreview = () => {
    setPreview(null)
    setSelectedFile(null)
  }

  if (!isOpen || !date) return null

  const isProcessing = isSaving || isDeleting

  const content = (
    <>
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-muted rounded-md">
            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Photo of the Day</h2>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <Calendar className="h-2.5 w-2.5" />
              <span>
                {formattedDate}, {year}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

          {preview ? (
            <div className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={handleClearPreview}
                disabled={isProcessing}
                className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all duration-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="absolute bottom-2 right-2 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-200 flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                w-full aspect-square rounded-lg border-2 border-dashed
                flex flex-col items-center justify-center gap-3
                transition-all duration-200
                ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/30"
                }
              `}
            >
              <div
                className={`
                p-3 rounded-xl transition-colors duration-200
                ${isDragging ? "bg-primary/10" : "bg-muted"}
              `}
              >
                <ImageIcon
                  className={`
                  h-6 w-6 transition-colors duration-200
                  ${isDragging ? "text-primary" : "text-muted-foreground/50"}
                `}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-0.5">
                  {isDragging ? "Drop your image here" : "Upload a photo"}
                </p>
                <p className="text-xs text-muted-foreground">Drag and drop or click to browse</p>
              </div>
            </button>
          )}

          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            This photo will appear as the background of the day cell.
          </p>
        </div>

        <div className="px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            {existingPhoto && onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isProcessing}
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isProcessing}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!preview || isProcessing} className="h-7 text-xs">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    {isUploading ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  "Save Photo"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="flex flex-col max-h-[90vh]">
          <DrawerDescription className="sr-only">Upload a photo for this day</DrawerDescription>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col border-l-0 shadow-2xl duration-200">
        <SheetDescription className="sr-only">Upload a photo for this day</SheetDescription>
        {content}
      </SheetContent>
    </Sheet>
  )
}
