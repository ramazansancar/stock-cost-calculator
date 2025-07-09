"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Combobox } from "@/components/ui/combobox"
import { Settings, Download, Copy, Trash2, User, Database, Link, Upload, Eye, Plus, Users } from "lucide-react"
import { ConfirmModal } from "./confirm-modal"
import { useToast } from "@/hooks/use-toast"
import { getUserId } from "@/lib/user-utils"
import { generateShareURL, parseURLData, clearURLData } from "@/lib/url-utils"
import { useProfiles } from "@/hooks/use-profiles"

interface StockTransaction {
  id: string
  symbol: string
  symbolName: string
  quantity: number
  price: number
  date: string
  type: "buy" | "sell"
  createdAt: string
}

interface UserData {
  user: string
  transactions: StockTransaction[]
}

interface SettingsDrawerProps {
  transactions: StockTransaction[]
  onImportTransactions: (transactions: StockTransaction[]) => void
  onClearAllData: () => void
}

export function SettingsDrawer({ transactions, onImportTransactions, onClearAllData }: SettingsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState("")
  const [importMode, setImportMode] = useState<"replace" | "append" | "view">("replace")
  const [pendingImportData, setPendingImportData] = useState<StockTransaction[] | null>(null)
  const [shareURL, setShareURL] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const {
    profiles,
    currentProfileId,
    currentUserId,
    addProfile,
    switchProfile,
    updateCurrentProfile,
    removeProfile,
    getCurrentProfile,
  } = useProfiles()

  const userId = getUserId()

  // URL'den veri kontrolü
  useEffect(() => {
    const urlData = parseURLData()
    if (urlData && urlData.user !== currentProfileId) {
      // Yeni profil ekle
      const profile = addProfile(urlData.user, urlData.transactions)
      toast({
        title: "Yeni Profil",
        description: `${profile.label} profili eklendi`,
      })
      clearURLData()
    }
  }, [])

  // Profil değişikliklerini takip et
  useEffect(() => {
    updateCurrentProfile(transactions)
  }, [transactions])

  const exportData = (): UserData => {
    return {
      user: currentProfileId,
      transactions: transactions,
    }
  }

  const getTransactionStats = () => {
    const buyCount = transactions.filter((t) => t.type === "buy").length
    const sellCount = transactions.filter((t) => t.type === "sell").length
    const uniqueStocks = new Set(transactions.map((t) => t.symbol)).size
    const totalValue = transactions.reduce((sum, t) => sum + t.quantity * t.price, 0)

    return { buyCount, sellCount, uniqueStocks, totalValue }
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData(), null, 2))
      toast({
        title: "Başarılı",
        description: "Veriler panoya kopyalandı",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Panoya kopyalama başarısız",
        variant: "destructive",
      })
    }
  }

  const handleDownloadFile = () => {
    const dataStr = JSON.stringify(exportData(), null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `hisse-portfoy-${currentProfileId.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Başarılı",
      description: "Veriler dosya olarak indirildi",
    })
  }

  const handleGenerateShareURL = () => {
    const data = {
      user: currentProfileId,
      transactions,
      timestamp: Date.now(),
    }
    const url = generateShareURL(data)
    setShareURL(url)

    toast({
      title: "Başarılı",
      description: "Paylaşım URL'si oluşturuldu",
    })
  }

  const handleCopyShareURL = async () => {
    try {
      await navigator.clipboard.writeText(shareURL)
      toast({
        title: "Başarılı",
        description: "Paylaşım URL'si panoya kopyalandı",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "URL kopyalama başarısız",
        variant: "destructive",
      })
    }
  }

  const validateAndImportData = (data: string, mode: "replace" | "append" | "view" = "replace") => {
    try {
      const parsed: UserData = JSON.parse(data)

      if (!parsed.user || !Array.isArray(parsed.transactions)) {
        throw new Error("Geçersiz veri formatı")
      }

      const validTransactions = parsed.transactions.every(
        (item: any) =>
          item.id &&
          item.symbol &&
          item.symbolName &&
          typeof item.quantity === "number" &&
          typeof item.price === "number" &&
          item.date &&
          (item.type === "buy" || item.type === "sell"),
      )

      if (!validTransactions) {
        throw new Error("Geçersiz işlem verisi")
      }

      if (mode === "view") {
        // Sadece görüntüleme - yeni profil ekle
        const profile = addProfile(parsed.user, parsed.transactions)
        const newTransactions = switchProfile(parsed.user)
        onImportTransactions(newTransactions)

        toast({
          title: "Profil Eklendi",
          description: `${profile.label} profili görüntüleme modunda eklendi`,
        })
      } else if (transactions.length > 0 && mode !== "replace") {
        // Mevcut veri var ve ekleme modu
        setPendingImportData(parsed.transactions)
        setImportMode(mode)
        setShowImportModal(true)
        return
      } else {
        // Doğrudan içe aktar
        if (mode === "append" && transactions.length > 0) {
          const combinedTransactions = [...transactions, ...parsed.transactions]
          onImportTransactions(combinedTransactions)
        } else {
          onImportTransactions(parsed.transactions)
        }

        toast({
          title: "Başarılı",
          description: `${parsed.transactions.length} işlem ${mode === "append" ? "eklendi" : "içe aktarıldı"}`,
        })
      }

      setImportText("")
    } catch (error) {
      toast({
        title: "Hata",
        description: "Geçersiz JSON formatı veya veri yapısı",
        variant: "destructive",
      })
    }
  }

  const handleImportFromText = () => {
    if (!importText.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen içe aktarılacak veriyi girin",
        variant: "destructive",
      })
      return
    }
    validateAndImportData(importText)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      validateAndImportData(content)
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = () => {
    if (!pendingImportData) return

    if (importMode === "append") {
      const combinedTransactions = [...transactions, ...pendingImportData]
      onImportTransactions(combinedTransactions)
    } else {
      onImportTransactions(pendingImportData)
    }

    toast({
      title: "Başarılı",
      description: `${pendingImportData.length} işlem ${importMode === "append" ? "eklendi" : "içe aktarıldı"}`,
    })

    setPendingImportData(null)
    setShowImportModal(false)
  }

  const handleClearAll = () => {
    onClearAllData()
    setShowClearModal(false)
    toast({
      title: "Başarılı",
      description: "Tüm veriler silindi",
    })
  }

  const handleProfileChange = (profileId: string) => {
    const newTransactions = switchProfile(profileId)
    onImportTransactions(newTransactions)

    const profile = profiles.find((p) => p.id === profileId)
    toast({
      title: "Profil Değiştirildi",
      description: `${profile?.label} profiline geçildi`,
    })
  }

  const handleRemoveProfile = (profileId: string) => {
    removeProfile(profileId)
    toast({
      title: "Profil Silindi",
      description: "Profil başarıyla silindi",
    })
  }

  const stats = getTransactionStats()
  const currentProfile = getCurrentProfile()

  const profileOptions = profiles.map((profile) => ({
    value: profile.id,
    label: profile.label,
  }))

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Ayarlar
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ayarlar</SheetTitle>
            <SheetDescription>Verilerinizi yönetin, profiller arası geçiş yapın</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Profil Yönetimi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Profil Yönetimi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Aktif Profil</Label>
                  <Combobox
                    options={profileOptions}
                    value={currentProfileId}
                    onValueChange={handleProfileChange}
                    placeholder="Profil seçin"
                    searchPlaceholder="Profil ara..."
                    emptyText="Profil bulunamadı"
                  />
                </div>

                {currentProfile && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Son güncelleme: {currentProfile.lastUpdated.toLocaleString("tr-TR")}</p>
                    <p>İşlem sayısı: {currentProfile.transactions.length}</p>
                    {!currentProfile.isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProfile(currentProfile.id)}
                        className="mt-2"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Profili Sil
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kullanıcı Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Kullanıcı Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Kullanıcı ID</p>
                    <p className="font-mono text-xs bg-gray-100 p-2 rounded">{currentProfileId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Toplam İşlem</p>
                    <p className="font-semibold">{transactions.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Alış İşlemi</p>
                    <p className="font-semibold text-green-600">{stats.buyCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Satış İşlemi</p>
                    <p className="font-semibold text-red-600">{stats.sellCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Farklı Hisse</p>
                    <p className="font-semibold">{stats.uniqueStocks}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Toplam İşlem Hacmi</p>
                    <p className="font-semibold">₺{stats.totalValue.toLocaleString("tr-TR")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Dışa Aktar
                </CardTitle>
                <CardDescription>Verilerinizi JSON formatında veya URL ile paylaşın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>JSON Verisi</Label>
                  <Textarea
                    value={JSON.stringify(exportData(), null, 2)}
                    readOnly
                    className="h-32 font-mono text-sm"
                    onClick={(e) => e.currentTarget.select()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleCopyToClipboard} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Kopyala
                  </Button>
                  <Button onClick={handleDownloadFile} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    İndir
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Paylaşım URL'si</Label>
                  <div className="flex gap-2">
                    <Button onClick={handleGenerateShareURL} variant="outline" className="flex-1">
                      <Link className="w-4 h-4 mr-2" />
                      URL Oluştur
                    </Button>
                  </div>
                  {shareURL && (
                    <div className="space-y-2">
                      <Input value={shareURL} readOnly className="text-xs" />
                      <Button onClick={handleCopyShareURL} size="sm" className="w-full">
                        <Copy className="w-4 h-4 mr-2" />
                        URL'yi Kopyala
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">İçe Aktar</CardTitle>
                <CardDescription>JSON formatında veri içe aktarın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>JSON Verisi</Label>
                  <Textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder='{"user": "xxx", "transactions": [...]}'
                    className="h-32 font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => validateAndImportData(importText, "replace")} size="sm">
                    <Upload className="w-4 h-4 mr-1" />
                    Değiştir
                  </Button>
                  <Button onClick={() => validateAndImportData(importText, "append")} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Ekle
                  </Button>
                  <Button onClick={() => validateAndImportData(importText, "view")} variant="secondary" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Görüntüle
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">veya</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dosyadan İçe Aktar</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Tehlikeli Alan</CardTitle>
                <CardDescription>Bu işlemler geri alınamaz</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setShowClearModal(true)}
                  className="w-full"
                  disabled={transactions.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Tüm Verileri Sil
                </Button>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Import Confirmation Modal */}
      <ConfirmModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onConfirm={handleConfirmImport}
        title="Veri İçe Aktarma"
        description={`Mevcut ${transactions.length} işleminiz var. ${pendingImportData?.length} yeni işlem ${importMode === "append" ? "eklenecek" : "mevcut verilerinizin yerine geçecek"}. Devam etmek istiyor musunuz?`}
        confirmText={importMode === "append" ? "Ekle" : "Değiştir"}
      />

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAll}
        title="Tüm Verileri Sil"
        description="Bu işlem tüm işlem geçmişinizi kalıcı olarak silecektir. Bu işlem geri alınamaz."
        confirmText="Sil"
        requireTyping={true}
        typingText="sil"
      />
    </>
  )
}
