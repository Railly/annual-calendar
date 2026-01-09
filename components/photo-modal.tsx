"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, ImageIcon, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface PhotoModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  existingPhoto?: string
  onSave: (date: Date, photoUrl: string) => void
  onRemove?: (date: Date) => void
}

export function PhotoModal({ isOpen, onClose, date, existingPhoto, onSave, onRemove }: PhotoModalProps) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formattedDate = date?.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const year = date?.getFullYear()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (preview && date) {
      onSave(date, preview)
      onClose()
    }
  }

  const handleRemove = () => {
    if (date && onRemove) {
      onRemove(date)
      onClose()
    }
  }

  if (!isOpen || !date) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col border-l-0 shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Camera className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Photo of the Day</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Calendar className="h-3 w-3" />
                <span>
                  {formattedDate}, {year}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            {preview ? (
              <div className="relative group">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                  <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all duration-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
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
                  w-full aspect-video rounded-lg border-2 border-dashed
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

            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              This photo will appear as the background of the day cell in your calendar.
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/20">
            <div className="flex items-center justify-between">
              {existingPhoto && onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemove}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!preview}>
                  Save Photo
                </Button>
              </div>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
