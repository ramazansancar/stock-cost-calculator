"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Coins } from "lucide-react"

interface CurrencyItem {
  id: number
  name: string
  value: number
}

interface CurrencySelectorProps {
  onSelect: (currency: CurrencyItem) => void
  apiData?: any
}

export function CurrencySelector({ onSelect, apiData }: CurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItem | null>(null)

  useEffect(() => {
    if (apiData && apiData.data) {
      setCurrencies(apiData.data)
      setLastUpdate(apiData.lastUpdate)
    }
  }, [apiData])

  const handleSelect = (currency: CurrencyItem) => {
    setSelectedCurrency(currency)
    onSelect(currency)
  }

  if (!apiData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          Döviz verileri yükleniyor...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {selectedCurrency ? (
        <div className="border rounded-lg p-3 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Coins className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-green-900">{selectedCurrency.name}</h3>
                <p className="text-sm text-green-700">₺{selectedCurrency.value.toFixed(4)}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCurrency(null)
                onSelect({} as CurrencyItem)
              }}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Döviz Seçin</span>
              {lastUpdate && <Badge variant="outline">Son güncelleme: {lastUpdate}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-64">
              <div className="space-y-1 pr-4">
                {currencies.map((currency) => (
                  <div
                    key={currency.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer rounded-lg border"
                    onClick={() => handleSelect(currency)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Coins className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{currency.name}</span>
                    </div>
                    <span className="font-bold">₺{currency.value.toFixed(4)}</span>
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
