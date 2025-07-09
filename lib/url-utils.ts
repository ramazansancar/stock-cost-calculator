"use client"

import { getUserId } from "./user-utils"

export interface URLData {
  user: string
  transactions: any[]
  timestamp: number
}

export function generateShareURL(data: URLData): string {
  if (typeof window === "undefined") return ""

  const compressed = btoa(JSON.stringify(data))
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}?data=${encodeURIComponent(compressed)}`
}

export function parseURLData(): URLData | null {
  if (typeof window === "undefined") return null

  const urlParams = new URLSearchParams(window.location.search)
  const dataParam = urlParams.get("data")

  if (!dataParam) return null

  try {
    const decoded = atob(decodeURIComponent(dataParam))
    const parsed = JSON.parse(decoded)

    if (parsed.user && Array.isArray(parsed.transactions)) {
      return parsed
    }
  } catch (error) {
    console.error("URL verisi parse edilemedi:", error)
  }

  return null
}

export function clearURLData(): void {
  if (typeof window === "undefined") return

  const url = new URL(window.location.href)
  url.searchParams.delete("data")
  window.history.replaceState({}, "", url.toString())
}

export function getProfileLabel(userId: string): string {
  const currentUserId = getUserId()
  if (userId === currentUserId) {
    return `Siz (${userId.slice(0, 8)})`
  }
  return `Profil ${userId.slice(0, 8)}`
}
