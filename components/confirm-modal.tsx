"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  requireTyping?: boolean
  typingText?: string
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Onayla",
  requireTyping = false,
  typingText = "sil",
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState("")

  const handleConfirm = () => {
    if (requireTyping && inputValue.toLowerCase() !== typingText.toLowerCase()) {
      return
    }
    onConfirm()
    setInputValue("")
    onClose()
  }

  const handleClose = () => {
    setInputValue("")
    onClose()
  }

  const canConfirm = !requireTyping || inputValue.toLowerCase() === typingText.toLowerCase()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requireTyping && (
          <div className="space-y-2">
            <Label htmlFor="confirm-input">
              Onaylamak için <span className="font-semibold">"{typingText}"</span> yazın:
            </Label>
            <Input
              id="confirm-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={typingText}
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            İptal
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
