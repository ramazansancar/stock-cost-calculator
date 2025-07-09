"use client"

export function generateUserId(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getUserId(): string {
  if (typeof window === "undefined") return ""

  let userId = localStorage.getItem("user-id")
  if (!userId) {
    userId = generateUserId()
    localStorage.setItem("user-id", userId)
  }
  return userId
}
