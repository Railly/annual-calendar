"use client"

import { cn } from "@/lib/utils"
import { Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface RepoFilterProps {
  repos: { name: string; color: string }[]
  selectedRepos: string[]
  onReposChange: (repos: string[]) => void
}

export function RepoFilter({ repos, selectedRepos, onReposChange }: RepoFilterProps) {
  const allSelected = selectedRepos.length === repos.length
  const noneSelected = selectedRepos.length === 0
  const activeCount = selectedRepos.length

  const handleToggleRepo = (repoName: string) => {
    if (selectedRepos.includes(repoName)) {
      onReposChange(selectedRepos.filter((name) => name !== repoName))
    } else {
      onReposChange([...selectedRepos, repoName])
    }
  }

  const handleSelectAll = () => {
    onReposChange(repos.map((r) => r.name))
  }

  const handleDeselectAll = () => {
    onReposChange([])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs px-2">
          <Filter className="h-2.5 w-2.5" />
          <span className="hidden sm:inline">Filter</span>
          {/* Always show badge when filtering */}
          <span className="ml-0.5 bg-emerald-600 text-white text-[9px] px-1 py-px rounded-full font-medium min-w-[14px] text-center">
            {activeCount}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="flex items-center justify-between mb-2 pb-2 border-b">
          <span className="text-xs font-medium text-muted-foreground">Filter by repo</span>
          <div className="flex gap-1">
            <button
              onClick={handleSelectAll}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded transition-colors",
                allSelected
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
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
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {repos.map((repo) => {
            const isSelected = selectedRepos.includes(repo.name)

            return (
              <label
                key={repo.name}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors",
                  isSelected ? "bg-muted/50" : "hover:bg-muted/30",
                )}
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleRepo(repo.name)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 transition-all flex items-center justify-center",
                      isSelected ? "border-transparent" : "border-muted-foreground/30",
                    )}
                    style={{
                      backgroundColor: isSelected ? repo.color : "transparent",
                      borderColor: isSelected ? repo.color : undefined,
                    }}
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
                  className={cn(
                    "text-sm font-medium flex-1 truncate",
                    isSelected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {repo.name}
                </span>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: repo.color }} />
              </label>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
