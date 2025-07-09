"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Gem } from "lucide-react"

interface GoldItem {
  id: number
  name: string
  buy: number
  sell: number
}

interface GoldSelectorProps {
  onSelect: (gold: GoldItem) => void
  apiData?: any
}

export function GoldSelector({ onSelect, apiData }: GoldSelectorProps) {
  const [goldItems, setGoldItems] = useState<GoldItem[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [selectedGold, setSelectedGold] = useState<GoldItem | null>(null)

  useEffect(() => {
    if (apiData && apiData.data) {
      setGoldItems(apiData.data)
      setLastUpdate(apiData.lastUpdate)
    }
  }, [apiData])

  const handleSelect = (gold: GoldItem) => {
    setSelectedGold(gold)
    onSelect(gold)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!apiData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-yellow-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          Altın verileri yükleniyor...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {selectedGold ? (
        <div className="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Gem className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-yellow-900">{selectedGold.name}</h3>
                <p className="text-sm text-yellow-700">
                  Alış: {formatCurrency(selectedGold.buy)} | Satış: {formatCurrency(selectedGold.sell)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedGold(null)
                onSelect({} as GoldItem)
              }}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Altın Türü Seçin</span>
              {lastUpdate && <Badge variant="outline">Son güncelleme: {lastUpdate}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-64">
              <div className="space-y-1 pr-4">
                {goldItems.map((gold) => (
                  <div
                    key={gold.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer rounded-lg border"
                    onClick={() => handleSelect(gold)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Gem className="w-4 h-4 text-yellow-600" />
                      </div>
                      <span className="font-medium">{gold.name}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div>Alış: {formatCurrency(gold.buy)}</div>
                      <div>Satış: {formatCurrency(gold.sell)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
