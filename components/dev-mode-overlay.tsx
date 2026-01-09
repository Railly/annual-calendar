"use client"

import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DevModeOverlayProps {
  isActive: boolean
}

export function DevModeOverlay({ isActive }: DevModeOverlayProps) {
  if (!isActive) return null

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center backdrop-blur-sm bg-background/80">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Github className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your Year in Code</h2>
        <p className="text-muted-foreground mb-6">
          Connect your GitHub account to visualize your coding activity throughout the year. See your commits,
          contributions, and coding patterns displayed on your calendar.
        </p>
        <Button size="lg" className="gap-2">
          <Github className="h-4 w-4" />
          Connect GitHub
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          We only read your public contribution data. No code access required.
        </p>
      </div>
    </div>
  )
}
