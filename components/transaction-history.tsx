"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ConfirmModal } from "./confirm-modal"
import {
  Building2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Hash,
  DollarSign,
  Calculator,
  Coins,
  Gem,
  Banknote,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bitcoin,
} from "lucide-react"

interface StockSymbol {
  _id: string
  ticker: string
  securityDesc: string
  code: string
  sector: string
  sectorDesc: {
    name: string
    nameEn: string
  }
  issuerName: string
}

interface StockTransaction {
  id: string
  symbol: string
  symbolName: string
  symbolDetails?: StockSymbol
  assetType: "stock" | "currency" | "gold" | "bank" | "crypto"
  quantity: number
  price: number
  date: string
  type: "buy" | "sell"
  createdAt: string
}

interface TransactionHistoryProps {
  transactions: StockTransaction[]
  onRemoveTransaction: (id: string) => void
}

export function TransactionHistory({ transactions, onRemoveTransaction }: TransactionHistoryProps) {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; transactionId: string }>({
    isOpen: false,
    transactionId: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getIconUrl = (code: string) => {
    return `https://web-api.forinvestcdn.com/definitions/icon?code=${code}`
  }

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case "stock":
        return <Building2 className="w-6 h-6 text-blue-600" />
      case "currency":
        return <Coins className="w-6 h-6 text-green-600" />
      case "gold":
        return <Gem className="w-6 h-6 text-yellow-600" />
      case "bank":
        return <Banknote className="w-6 h-6 text-purple-600" />
      case "crypto":
        return <Bitcoin className="w-6 h-6 text-orange-600" />
      default:
        return <Building2 className="w-6 h-6 text-blue-600" />
    }
  }

  const getAssetTypeLabel = (assetType: string) => {
    switch (assetType) {
      case "stock":
        return "Hisse"
      case "currency":
        return "Döviz"
      case "gold":
        return "Altın"
      case "bank":
        return "Banka"
      case "crypto":
        return "Kripto"
      default:
        return "Hisse"
    }
  }

  const handleDeleteClick = (transactionId: string) => {
    setDeleteModal({ isOpen: true, transactionId })
  }

  const handleConfirmDelete = () => {
    onRemoveTransaction(deleteModal.transactionId)
    setDeleteModal({ isOpen: false, transactionId: "" })
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  // Pagination calculations
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const start = Math.max(1, currentPage - 2)
      const end = Math.min(totalPages, start + maxVisiblePages - 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>İşlem Geçmişi</CardTitle>
              <CardDescription>
                {sortedTransactions.length > 0
                  ? `Tüm alım-satım işlemleriniz (${sortedTransactions.length} işlem)`
                  : "Henüz işlem eklenmemiş"}
              </CardDescription>
            </div>
            {transactions.length > 0 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="items-per-page" className="text-sm">
                  Sayfa başına:
                </Label>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz işlem yok</h3>
              <p className="text-gray-500 mb-4">İlk işleminizi eklemek için yukarıdaki formu kullanın</p>
              <p className="text-sm text-gray-400">
                Hisse senedi, döviz, altın, kripto para veya banka dövizi işlemi ekleyebilirsiniz
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {currentTransactions.map((transaction) => {
                  const totalAmount = transaction.quantity * transaction.price

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="w-12 h-12">
                          {transaction.assetType === "stock" ? (
                            <AvatarImage
                              src={getIconUrl(transaction.symbol) || "/placeholder.svg"}
                              alt={transaction.symbol}
                            />
                          ) : null}
                          <AvatarFallback>{getAssetIcon(transaction.assetType)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{transaction.symbol}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getAssetTypeLabel(transaction.assetType)}
                            </Badge>
                            <Badge
                              variant={transaction.type === "buy" ? "default" : "secondary"}
                              className={`${
                                transaction.type === "buy"
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : "bg-red-100 text-red-800 border-red-300"
                              } cursor-default font-semibold`}
                            >
                              {transaction.type === "buy" ? (
                                <>
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  ALIM
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                  SATIM
                                </>
                              )}
                            </Badge>
                            <span className="text-xs text-gray-500">{transaction.date}</span>
                          </div>

                          <p className="text-sm text-gray-600 mb-2 truncate">{transaction.symbolName}</p>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">Adet:</span>
                              <span className="font-semibold">{transaction.quantity}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">Fiyat:</span>
                              <span className="font-semibold">{formatCurrency(transaction.price)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calculator className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">Toplam:</span>
                              <span className="font-bold text-base">{formatCurrency(totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(transaction.id)}
                        className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {startIndex + 1}-{Math.min(endIndex, sortedTransactions.length)} / {sortedTransactions.length} işlem
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {getPageNumbers().map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, transactionId: "" })}
        onConfirm={handleConfirmDelete}
        title="İşlemi Sil"
        description="Bu işlemi kalıcı olarak silmek istediğinizden emin misiniz?"
        confirmText="Sil"
      />
    </>
  )
}
