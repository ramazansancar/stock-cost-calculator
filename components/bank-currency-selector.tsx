"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Banknote, TrendingUp, TrendingDown } from "lucide-react"

interface BankCurrencyItem {
  id: number
  currencyCode: string
  name: string
  buy: number
  sell: number
  change: number
}

interface BankCurrencySelectorProps {
  onSelect: (currency: BankCurrencyItem) => void
  apiData?: any
}

export function BankCurrencySelector({ onSelect, apiData }: BankCurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<BankCurrencyItem[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<BankCurrencyItem | null>(null)

  useEffect(() => {
    if (apiData && apiData.data) {
      // TL hariç diğer para birimlerini al
      const filteredCurrencies = apiData.data.filter((item: BankCurrencyItem) => item.currencyCode !== "TL")
      setCurrencies(filteredCurrencies)
    }
  }, [apiData])

  const handleSelect = (currency: BankCurrencyItem) => {
    setSelectedCurrency(currency)
    onSelect(currency)
  }

  if (!apiData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          Banka döviz verileri yükleniyor...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {selectedCurrency ? (
        <div className="border rounded-lg p-3 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Banknote className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-purple-900">
                  {selectedCurrency.currencyCode} - {selectedCurrency.name}
                </h3>
                <p className="text-sm text-purple-700">
                  Alış: ₺{selectedCurrency.buy.toFixed(4)} | Satış: ₺{selectedCurrency.sell.toFixed(4)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCurrency(null)
                onSelect({} as BankCurrencyItem)
              }}
              className="text-purple-600 hover:text-purple-800"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Banka Dövizi Seçin</CardTitle>
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
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Banknote className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <span className="font-medium">{currency.currencyCode}</span>
                        <p className="text-xs text-gray-500">{currency.name}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>Alış: ₺{currency.buy.toFixed(4)}</div>
                      <div>Satış: ₺{currency.sell.toFixed(4)}</div>
                      <div
                        className={`flex items-center gap-1 ${currency.change >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {currency.change >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {currency.change.toFixed(2)}%
                      </div>
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
