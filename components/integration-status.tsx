"use client"

import { useState, useEffect, useCallback } from "react"
import { SignInButton, SignOutButton, useUser, useClerk } from "@clerk/nextjs"
import { Github, RefreshCw, Check, X, LogOut, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface AuthStatus {
  authenticated: boolean
  userId?: string
  github: {
    connected: boolean
    username?: string | null
  }
  google: {
    connected: boolean
    email?: string | null
  }
}

interface IntegrationStatusProps {
  onGoogleSync?: () => Promise<void>
  onGitHubSync?: () => Promise<boolean>
  lastGoogleSync?: Date | null
  lastGitHubSync?: string | null
  isGitHubSyncing?: boolean
}

export function IntegrationStatus({ onGoogleSync, onGitHubSync, lastGoogleSync, lastGitHubSync, isGitHubSyncing }: IntegrationStatusProps) {
  const { isSignedIn, user } = useUser()
  const { openUserProfile } = useClerk()
  const [status, setStatus] = useState<AuthStatus | null>(null)
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to fetch auth status:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus, isSignedIn])

  const handleGoogleSync = async () => {
    if (!onGoogleSync) return
    setIsGoogleSyncing(true)
    try {
      await onGoogleSync()
    } finally {
      setIsGoogleSyncing(false)
    }
  }

  const handleGitHubSync = async () => {
    if (!onGitHubSync) return
    await onGitHubSync()
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
        <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isSignedIn || !status?.authenticated) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" size="sm" className="h-5 gap-1 text-[10px] px-1.5 bg-transparent">
          <User className="h-2.5 w-2.5" />
          Sign In
        </Button>
      </SignInButton>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 gap-1 text-[10px] px-1.5">
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                status.github.connected ? "bg-green-500" : "bg-zinc-400"
              )}
            />
            <Github className="h-2.5 w-2.5" />
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                status.google.connected ? "bg-green-500" : "bg-zinc-400"
              )}
            />
            <Calendar className="h-2.5 w-2.5" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            {user?.imageUrl ? (
              <img src={user.imageUrl || "/placeholder.svg"} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <User className="h-3 w-3" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.fullName || user?.username}</span>
            <span className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Integrations
        </DropdownMenuLabel>

        <DropdownMenuItem
          className="flex items-center justify-between cursor-pointer"
          onClick={() => {
            if (!status.github.connected) {
              window.location.href = "/sign-in?redirect_url=" + encodeURIComponent(window.location.href)
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </div>
          {status.github.connected ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-green-500" />
              <span>@{status.github.username}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <X className="h-3 w-3 text-zinc-400" />
              <span>Connect</span>
            </div>
          )}
        </DropdownMenuItem>

        {status.github.connected && onGitHubSync && (
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer pl-8" onClick={handleGitHubSync}>
            <RefreshCw className={cn("h-3 w-3", isGitHubSyncing && "animate-spin")} />
            <div className="flex flex-col">
              <span className="text-xs">Sync GitHub</span>
              {lastGitHubSync && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(lastGitHubSync).toLocaleString()}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="flex items-center justify-between cursor-pointer"
          onClick={() => {
            if (!status.google.connected) {
              window.location.href = "/sign-in?redirect_url=" + encodeURIComponent(window.location.href)
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Google Calendar</span>
          </div>
          {status.google.connected ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-green-500" />
              <span className="truncate max-w-[100px]">{status.google.email}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <X className="h-3 w-3 text-zinc-400" />
              <span>Connect</span>
            </div>
          )}
        </DropdownMenuItem>

        {status.google.connected && onGoogleSync && (
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer pl-8" onClick={handleGoogleSync}>
            <RefreshCw className={cn("h-3 w-3", isGoogleSyncing && "animate-spin")} />
            <div className="flex flex-col">
              <span className="text-xs">Sync Google Calendar</span>
              {lastGoogleSync && (
                <span className="text-[10px] text-muted-foreground">
                  {lastGoogleSync.toLocaleString()}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
          onClick={() => openUserProfile()}
        >
          <User className="h-4 w-4" />
          <span>Manage Account</span>
        </DropdownMenuItem>

        <SignOutButton>
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
