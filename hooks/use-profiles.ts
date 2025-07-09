"use client"

import { useState, useEffect } from "react"
import { getUserId } from "@/lib/user-utils"

export interface Profile {
  id: string
  label: string
  transactions: any[]
  isOwner: boolean
  lastUpdated: Date
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentProfileId, setCurrentProfileId] = useState<string>("")

  const currentUserId = getUserId()

  useEffect(() => {
    // Mevcut kullanıcı profilini yükle
    const savedProfiles = localStorage.getItem("user-profiles")
    let loadedProfiles: Profile[] = []

    if (savedProfiles) {
      try {
        loadedProfiles = JSON.parse(savedProfiles)
      } catch (error) {
        console.error("Profiller yüklenemedi:", error)
      }
    }

    // Mevcut kullanıcı profili yoksa oluştur
    const currentProfile = loadedProfiles.find((p) => p.id === currentUserId)
    if (!currentProfile) {
      const transactions = JSON.parse(localStorage.getItem("stock-transactions") || "[]")
      const newProfile: Profile = {
        id: currentUserId,
        label: `Siz (${currentUserId.slice(0, 8)})`,
        transactions,
        isOwner: true,
        lastUpdated: new Date(),
      }
      loadedProfiles.push(newProfile)
    }

    setProfiles(loadedProfiles)
    setCurrentProfileId(currentUserId)

    // Profilleri kaydet
    localStorage.setItem("user-profiles", JSON.stringify(loadedProfiles))
  }, [currentUserId])

  const addProfile = (userId: string, transactions: any[], label?: string) => {
    const newProfile: Profile = {
      id: userId,
      label: label || `Profil ${userId.slice(0, 8)}`,
      transactions,
      isOwner: userId === currentUserId,
      lastUpdated: new Date(),
    }

    const updatedProfiles = [...profiles.filter((p) => p.id !== userId), newProfile]
    setProfiles(updatedProfiles)
    localStorage.setItem("user-profiles", JSON.stringify(updatedProfiles))

    return newProfile
  }

  const switchProfile = (profileId: string) => {
    setCurrentProfileId(profileId)
    const profile = profiles.find((p) => p.id === profileId)
    return profile?.transactions || []
  }

  const updateCurrentProfile = (transactions: any[]) => {
    const updatedProfiles = profiles.map((p) =>
      p.id === currentProfileId ? { ...p, transactions, lastUpdated: new Date() } : p,
    )
    setProfiles(updatedProfiles)
    localStorage.setItem("user-profiles", JSON.stringify(updatedProfiles))

    // Eğer mevcut kullanıcının profili ise localStorage'ı da güncelle
    if (currentProfileId === currentUserId) {
      localStorage.setItem("stock-transactions", JSON.stringify(transactions))
    }
  }

  const removeProfile = (profileId: string) => {
    if (profileId === currentUserId) return // Kendi profilini silemez

    const updatedProfiles = profiles.filter((p) => p.id !== profileId)
    setProfiles(updatedProfiles)
    localStorage.setItem("user-profiles", JSON.stringify(updatedProfiles))

    if (currentProfileId === profileId) {
      setCurrentProfileId(currentUserId)
    }
  }

  const getCurrentProfile = () => {
    return profiles.find((p) => p.id === currentProfileId)
  }

  return {
    profiles,
    currentProfileId,
    currentUserId,
    addProfile,
    switchProfile,
    updateCurrentProfile,
    removeProfile,
    getCurrentProfile,
  }
}
