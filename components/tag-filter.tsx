"use client"

import { cn } from "@/lib/utils"
import type { EventTag } from "@/lib/calendar-data"
import { Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const TAG_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  orange: { bg: "bg-orange-500", border: "border-orange-500", text: "text-orange-600" },
  teal: { bg: "bg-teal-500", border: "border-teal-500", text: "text-teal-600" },
  purple: { bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-600" },
  green: { bg: "bg-emerald-500", border: "border-emerald-500", text: "text-emerald-600" },
  pink: { bg: "bg-pink-500", border: "border-pink-500", text: "text-pink-600" },
  blue: { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-600" },
  yellow: { bg: "bg-amber-400", border: "border-amber-400", text: "text-amber-600" },
  red: { bg: "bg-red-500", border: "border-red-500", text: "text-red-600" },
}

interface TagFilterProps {
  tags: EventTag[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export function TagFilter({ tags, selectedTags, onTagsChange }: TagFilterProps) {
  const allSelected = selectedTags.length === tags.length
  const noneSelected = selectedTags.length === 0
  const activeCount = selectedTags.length

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId))
    } else {
      onTagsChange([...selectedTags, tagId])
    }
  }

  const handleSelectAll = () => {
    onTagsChange(tags.map((t) => t.id))
  }

  const handleDeselectAll = () => {
    onTagsChange([])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filter</span>
          {!allSelected && activeCount > 0 && (
            <span className="ml-0.5 bg-teal-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="flex items-center justify-between mb-2 pb-2 border-b">
          <span className="text-xs font-medium text-muted-foreground">Filter by tag</span>
          <div className="flex gap-1">
            <button
              onClick={handleSelectAll}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded transition-colors",
                allSelected
                  ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            <button
              onClick={handleDeselectAll}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded transition-colors",
                noneSelected ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              None
            </button>
          </div>
        </div>
        <div className="space-y-1">
          {tags.map((tag) => {
            const colors = TAG_COLORS[tag.color] || TAG_COLORS.blue
            const isSelected = selectedTags.includes(tag.id)

            return (
              <label
                key={tag.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors",
                  isSelected ? "bg-muted/50" : "hover:bg-muted/30",
                )}
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleTag(tag.id)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 transition-all flex items-center justify-center",
                      isSelected ? cn(colors.bg, colors.border) : "border-muted-foreground/30",
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  className={cn("text-sm font-medium flex-1", isSelected ? "text-foreground" : "text-muted-foreground")}
                >
                  {tag.name}
                </span>
                <div className={cn("w-2 h-2 rounded-full", colors.bg)} />
              </label>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
