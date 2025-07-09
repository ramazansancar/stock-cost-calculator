"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Building2, Filter, X } from "lucide-react"

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

interface Sector {
  _id: string
  code: string
  name: string
  nameEn: string
}

interface StockSelectorProps {
  onSelect: (symbol: StockSymbol) => void
  placeholder?: string
  value?: string
  selectedSymbol?: StockSymbol | null
}

// Global cache for symbols and sectors
let symbolsCache: StockSymbol[] | null = null
let sectorsCache: Sector[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 dakika

export function StockSelector({
  onSelect,
  placeholder = "Lütfen hisse kodu seçiniz",
  value,
  selectedSymbol,
}: StockSelectorProps) {
  const [searchTerm, setSearchTerm] = useState(value || "")
  const [symbols, setSymbols] = useState<StockSymbol[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [filteredSymbols, setFilteredSymbols] = useState<StockSymbol[]>([])
  const [selectedSector, setSelectedSector] = useState<string>("all")
  const [loading, setLoading] = useState(false)

  // Cache'den veri yükle veya API'den çek
  useEffect(() => {
    const fetchData = async () => {
      const now = Date.now()

      // Cache geçerli mi kontrol et
      if (symbolsCache && sectorsCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
        setSymbols(symbolsCache)
        setSectors(sectorsCache)
        return
      }

      setLoading(true)
      try {
        const [symbolsResponse, sectorsResponse] = await Promise.all([
          fetch("https://publicapi.ramazansancar.com.tr/foreks/symbols/"),
          fetch("https://publicapi.ramazansancar.com.tr/foreks/sectors"),
        ])

        const symbolsData = await symbolsResponse.json()
        const sectorsData = await sectorsResponse.json()

        if (symbolsData.success && symbolsData.data) {
          symbolsCache = symbolsData.data
          setSymbols(symbolsData.data)
        }

        if (sectorsData.success && sectorsData.data) {
          // Sektörleri A->Z sırala
          const sortedSectors = sectorsData.data.sort((a: Sector, b: Sector) => {
            const nameA = formatSectorName(a.name).toLowerCase()
            const nameB = formatSectorName(b.name).toLowerCase()
            return nameA.localeCompare(nameB, "tr")
          })
          sectorsCache = sortedSectors
          setSectors(sortedSectors)
        }

        // Cache timestamp'ini güncelle
        cacheTimestamp = now
      } catch (error) {
        console.error("Veri yüklenirken hata:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Arama ve sektör filtresi
  useEffect(() => {
    let filtered = symbols

    // Sektör filtresi
    if (selectedSector !== "all") {
      filtered = filtered.filter((symbol) => symbol.sector === selectedSector)
    }

    // Arama filtresi
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (symbol) =>
          symbol.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symbol.securityDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symbol.issuerName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredSymbols(filtered)
  }, [searchTerm, symbols, selectedSector])

  const handleSelect = (symbol: StockSymbol) => {
    setSearchTerm(symbol.code)
    onSelect(symbol)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSectorChange = (value: string) => {
    setSelectedSector(value)
  }

  const handleClear = () => {
    setSearchTerm("")
    onSelect({} as StockSymbol)
  }

  const getIconUrl = (code: string) => {
    return `https://web-api.forinvestcdn.com/definitions/icon?code=${code}`
  }

  const formatSectorName = (sectorName: string) => {
    if (!sectorName) return "Diğer"
    return sectorName.replace(/\\/g, "").split(",")[0].trim()
  }

  const getTotalCount = () => {
    let filtered = symbols
    if (selectedSector !== "all") {
      filtered = filtered.filter((symbol) => symbol.sector === selectedSector)
    }
    return filtered.length
  }

  return (
    <div className="space-y-3">
      {/* Seçili hisse gösterimi */}
      {selectedSymbol && selectedSymbol.code ? (
        <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={getIconUrl(selectedSymbol.code) || "/placeholder.svg"} alt={selectedSymbol.code} />
                <AvatarFallback>
                  <Building2 className="w-5 h-5 text-blue-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-blue-900">{selectedSymbol.code}</span>
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    {formatSectorName(selectedSymbol.sectorDesc?.name)}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-blue-800 truncate">{selectedSymbol.securityDesc}</p>
                <p className="text-xs text-blue-600 truncate">{selectedSymbol.issuerName}</p>
              </div>
            </div>
            <button onClick={handleClear} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Hisse Kodu Seçin</span>
              {symbolsCache && (
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
                placeholder={placeholder}
                value={searchTerm}
                onChange={handleInputChange}
                className="pl-10"
              />
            </div>

            {/* Sektör Filtresi */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedSector} onValueChange={handleSectorChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sektör seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sektörler</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector._id} value={sector.code}>
                      {formatSectorName(sector.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sonuç sayısı */}
            <div className="text-xs text-gray-500">
              {searchTerm
                ? `${filteredSymbols.length} sonuç bulundu`
                : `Toplam ${getTotalCount()} hisse${selectedSector !== "all" ? " (filtrelenmiş)" : ""}`}
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                Yükleniyor...
              </div>
            ) : (
              <ScrollArea className="h-80">
                {filteredSymbols.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    {searchTerm ? "Sonuç bulunamadı" : "Hisse bulunamadı"}
                  </div>
                ) : (
                  <div className="space-y-1 pr-4">
                    {filteredSymbols.map((symbol) => (
                      <div
                        key={symbol._id}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg border"
                        onClick={() => handleSelect(symbol)}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={getIconUrl(symbol.code) || "/placeholder.svg"} alt={symbol.code} />
                          <AvatarFallback>
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-base text-gray-900">{symbol.code}</span>
                            <Badge variant="outline" className="text-xs">
                              {formatSectorName(symbol.sectorDesc?.name)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-700 truncate">{symbol.securityDesc}</p>
                          <p className="text-xs text-gray-500 truncate">{symbol.issuerName}</p>
                        </div>
                      </div>
                    ))}
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
