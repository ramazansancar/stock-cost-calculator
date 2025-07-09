"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Bitcoin, X } from "lucide-react"

interface CryptoSymbol {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: string
  price?: string
}

interface CryptoSelectorProps {
  onSelect: (crypto: CryptoSymbol) => void
  selectedCrypto?: CryptoSymbol | null
}

// Global cache for crypto symbols and prices
let cryptoSymbolsCache: CryptoSymbol[] | null = null
let cryptoPricesCache: Record<string, string> | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 dakika

export function CryptoSelector({ onSelect, selectedCrypto }: CryptoSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [symbols, setSymbols] = useState<CryptoSymbol[]>([])
  const [filteredSymbols, setFilteredSymbols] = useState<CryptoSymbol[]>([])
  const [loading, setLoading] = useState(false)

  // Cache'den veri yükle veya API'den çek
  useEffect(() => {
    const fetchCryptoData = async () => {
      const now = Date.now()

      // Cache geçerli mi kontrol et
      if (cryptoSymbolsCache && cryptoPricesCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
        const symbolsWithPrices = cryptoSymbolsCache.map((symbol) => ({
          ...symbol,
          price: cryptoPricesCache![symbol.symbol] || "0",
        }))
        setSymbols(symbolsWithPrices)
        return
      }

      setLoading(true)
      try {
        // Sembol listesi ve fiyatları paralel olarak çek
        const [exchangeResponse, pricesResponse] = await Promise.all([
          fetch("https://api.binance.com/api/v3/exchangeInfo"),
          fetch("https://api.binance.com/api/v3/ticker/price"),
        ])

        const exchangeData = await exchangeResponse.json()
        const pricesData = await pricesResponse.json()

        if (exchangeData.symbols && Array.isArray(pricesData)) {
          // Sadece USDT paritelerini filtrele ve aktif olanları al
          const usdtSymbols = exchangeData.symbols
            .filter(
              (symbol: any) =>
                (
                  symbol.quoteAsset === "USDT" //||
                  //symbol.quoteAsset === "TRY"
                ) &&
                  symbol.status === "TRADING" &&
                  symbol.isSpotTradingAllowed,
            )
            .map((symbol: any) => ({
              symbol: symbol.symbol,
              baseAsset: symbol.baseAsset,
              quoteAsset: symbol.quoteAsset,
              status: symbol.status,
            }))

          // Fiyat haritası oluştur
          const priceMap: Record<string, string> = {}
          pricesData.forEach((price: any) => {
            priceMap[price.symbol] = price.price
          })

          // Fiyatları sembollere ekle
          const symbolsWithPrices = usdtSymbols.map((symbol: CryptoSymbol) => ({
            ...symbol,
            price: priceMap[symbol.symbol] || "0",
          }))

          // Cache'e kaydet
          cryptoSymbolsCache = symbolsWithPrices
          cryptoPricesCache = priceMap
          cacheTimestamp = now

          setSymbols(symbolsWithPrices)
        }
      } catch (error) {
        console.error("Kripto verileri yüklenirken hata:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCryptoData()
  }, [])

  // Arama filtresi
  useEffect(() => {
    let filtered = symbols

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (symbol) =>
          symbol.baseAsset.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Fiyata göre sırala (yüksekten düşüğe)
    filtered.sort((a, b) => Number.parseFloat(b.price || "0") - Number.parseFloat(a.price || "0"))

    setFilteredSymbols(filtered)
  }, [searchTerm, symbols])

  const handleSelect = (crypto: CryptoSymbol) => {
    onSelect(crypto)
  }

  const handleClear = () => {
    onSelect({} as CryptoSymbol)
  }

  const getIconUrl = (baseAsset: string) => {
    return `https://bin.bnbstatic.com/static/assets/logos/${baseAsset}.png`
  }

  const formatPrice = (price: string) => {
    const numPrice = Number.parseFloat(price)
    if (numPrice >= 1) {
      return `$${numPrice.toFixed(2)}`
    } else {
      return `$${numPrice.toFixed(6)}`
    }
  }

  return (
    <div className="space-y-3">
      {/* Seçili kripto gösterimi */}
      {selectedCrypto && selectedCrypto.symbol ? (
        <div className="border rounded-lg p-3 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={getIconUrl(selectedCrypto.baseAsset) || "/placeholder.svg"}
                  alt={selectedCrypto.baseAsset}
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
                <AvatarFallback>
                  <Bitcoin className="w-5 h-5 text-orange-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-orange-900">{selectedCrypto.baseAsset}</span>
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    {selectedCrypto.symbol}
                  </Badge>
                </div>
                <p className="text-sm text-orange-700">{selectedCrypto.price && formatPrice(selectedCrypto.price)}</p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-orange-600 hover:text-orange-800 p-1 hover:bg-orange-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Kripto Para Seçin</span>
              {cryptoSymbolsCache && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                  Önbellekli
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Arama */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Bitcoin, ETH, BNB ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sonuç sayısı */}
            <div className="text-xs text-gray-500">
              {searchTerm ? `${filteredSymbols.length} sonuç bulundu` : `Toplam ${symbols.length} USDT paritesi`}
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                Kripto verileri yükleniyor...
              </div>
            ) : (
              <ScrollArea className="h-80">
                {filteredSymbols.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    {searchTerm ? "Sonuç bulunamadı" : "Kripto para bulunamadı"}
                  </div>
                ) : (
                  <div className="space-y-1 pr-4">
                    {filteredSymbols.slice(0, 100).map((crypto) => (
                      <div
                        key={crypto.symbol}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg border"
                        onClick={() => handleSelect(crypto)}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={getIconUrl(crypto.baseAsset) || "/placeholder.svg"}
                            alt={crypto.baseAsset}
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                          <AvatarFallback>
                            <Bitcoin className="w-5 h-5 text-orange-600" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-base text-gray-900">{crypto.baseAsset}</span>
                            <Badge variant="outline" className="text-xs">
                              {crypto.symbol}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{crypto.price && formatPrice(crypto.price)}</p>
                        </div>
                      </div>
                    ))}
                    {filteredSymbols.length > 100 && (
                      <div className="text-center text-xs text-gray-500 py-2">
                        İlk 100 sonuç gösteriliyor. Daha spesifik arama yapın.
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
