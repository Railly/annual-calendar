"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"

interface PhotoModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  existingPhoto?: string
  onSave: (date: Date, photoUrl: string) => void
  onRemove?: (date: Date) => void
}

function PhotoForm({
  date,
  existingPhoto,
  onSave,
  onRemove,
  onClose,
}: {
  date: Date | null
  existingPhoto?: string
  onSave: (photoUrl: string) => void
  onRemove?: () => void
  onClose: () => void
}) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (preview) {
      onSave(preview)
    }
  }

  const formattedDate = date?.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{formattedDate}</p>

      <div className="space-y-2">
        <Label>Day Background Photo</Label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {preview ? (
          <div className="relative aspect-square max-w-[200px] rounded-lg overflow-hidden border">
            <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video max-w-[300px] border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/50 transition-colors"
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
          </button>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        {existingPhoto && onRemove && (
          <Button type="button" variant="destructive" onClick={onRemove}>
            Remove Photo
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={!preview}>
          Save Photo
        </Button>
      </div>
    </form>
  )
}

export function PhotoModal({ isOpen, onClose, date, existingPhoto, onSave, onRemove }: PhotoModalProps) {
  const isMobile = useIsMobile()

  const handleSave = (photoUrl: string) => {
    if (date) {
      onSave(date, photoUrl)
    }
    onClose()
  }

  const handleRemove = () => {
    if (date && onRemove) {
      onRemove(date)
    }
    onClose()
  }

  if (!isOpen || !date) return null

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add Photo</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <PhotoForm
              date={date}
              existingPhoto={existingPhoto}
              onSave={handleSave}
              onRemove={existingPhoto ? handleRemove : undefined}
              onClose={onClose}
            />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Photo</DialogTitle>
        </DialogHeader>
        <PhotoForm
          date={date}
          existingPhoto={existingPhoto}
          onSave={handleSave}
          onRemove={existingPhoto ? handleRemove : undefined}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
