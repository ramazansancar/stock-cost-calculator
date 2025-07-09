"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { StockSelector } from "./stock-selector"
import { CurrencySelector } from "./currency-selector"
import { GoldSelector } from "./gold-selector"
import { BankCurrencySelector } from "./bank-currency-selector"
import { CryptoSelector } from "./crypto-selector"
import {
  Plus,
  Minus,
  ShoppingCart,
  DollarSign,
  Calculator,
  TrendingUp,
  Coins,
  Banknote,
  Gem,
  Bitcoin,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

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

interface CurrencyItem {
  id: number
  name: string
  value: number
}

interface GoldItem {
  id: number
  name: string
  buy: number
  sell: number
}

interface BankCurrencyItem {
  id: number
  currencyCode: string
  name: string
  buy: number
  sell: number
  change: number
}

interface CryptoSymbol {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: string
  price?: string
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

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<StockTransaction, "id" | "date" | "createdAt">) => void
  transactions: StockTransaction[]
  apiData?: any
}

export function TransactionForm({ onAddTransaction, transactions, apiData }: TransactionFormProps) {
  const [assetType, setAssetType] = useState<"stock" | "currency" | "gold" | "bank" | "crypto">("stock")
  const [selectedSymbol, setSelectedSymbol] = useState<StockSymbol | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItem | null>(null)
  const [selectedGold, setSelectedGold] = useState<GoldItem | null>(null)
  const [selectedBankCurrency, setSelectedBankCurrency] = useState<BankCurrencyItem | null>(null)
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoSymbol | null>(null)
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [totalAmount, setTotalAmount] = useState("")

  // Hisse fiyatını çek
  const fetchStockPrice = async (symbol: string) => {
    try {
      const response = await fetch(`https://publicapi.ramazansancar.com.tr/foreks/symbols/${symbol}`)
      const data = await response.json()
      if (data.success && data.data && data.data.length > 0) {
        const stockData = data.data[0]
        setPrice(stockData.last?.toString() || "")
      }
    } catch (error) {
      console.error("Hisse fiyatı alınırken hata:", error)
    }
  }

  // Mevcut hisse miktarını hesapla
  const getAvailableQuantity = (symbol: string): number => {
    return transactions
      .filter((t) => t.symbol === symbol && t.assetType === assetType)
      .reduce((total, t) => {
        return t.type === "buy" ? total + t.quantity : total - t.quantity
      }, 0)
  }

  const availableQuantity = selectedSymbol ? getAvailableQuantity(selectedSymbol.code) : 0

  // Hesaplama fonksiyonları
  const updateCalculations = (changedField: "quantity" | "price" | "total", value: string) => {
    const qty = changedField === "quantity" ? Number.parseFloat(value) : Number.parseFloat(quantity)
    const prc = changedField === "price" ? Number.parseFloat(value) : Number.parseFloat(price)
    const total = changedField === "total" ? Number.parseFloat(value) : Number.parseFloat(totalAmount)

    if (changedField === "quantity" || changedField === "price") {
      if (!isNaN(qty) && !isNaN(prc)) {
        setTotalAmount((qty * prc).toFixed(2))
      }
    } else if (changedField === "total") {
      if (!isNaN(total) && !isNaN(prc) && prc > 0) {
        const calculatedQuantity = Math.floor(total / prc)
        setQuantity(calculatedQuantity.toString())
        setTotalAmount((calculatedQuantity * prc).toFixed(2))
      }
    }
  }

  // Input değişiklik handlers
  const handleQuantityChange = (value: string) => {
    setQuantity(value)
    if (value && price) {
      updateCalculations("quantity", value)
    }
  }

  const handlePriceChange = (value: string) => {
    setPrice(value)
    if (value && quantity) {
      updateCalculations("price", value)
    }
  }

  const handleTotalAmountChange = (value: string) => {
    setTotalAmount(value)
    if (value && price) {
      updateCalculations("total", value)
    }
  }

  const handleAssetTypeChange = (value: string) => {
    setAssetType(value as "stock" | "currency" | "gold" | "bank" | "crypto")
    setSelectedSymbol(null)
    setSelectedCurrency(null)
    setSelectedGold(null)
    setSelectedBankCurrency(null)
    setSelectedCrypto(null)
    setQuantity("")
    setPrice("")
    setTotalAmount("")
  }

  const handleSymbolSelect = async (symbol: any) => {
    if (assetType === "stock") {
      if (symbol.code) {
        setSelectedSymbol(symbol)
        // Hisse seçildiğinde güncel fiyatı çek
        await fetchStockPrice(symbol.code)
      } else {
        setSelectedSymbol(null)
        setPrice("")
      }
    } else if (assetType === "currency") {
      setSelectedCurrency(symbol)
      if (symbol.value) {
        setPrice(symbol.value.toString())
      }
    } else if (assetType === "gold") {
      setSelectedGold(symbol)
      if (symbol.buy !== undefined) {
        // Alış/satış türüne göre fiyat belirle - artık number olarak geliyor
        const priceValue = transactionType === "buy" ? symbol.buy : symbol.sell
        if (priceValue !== undefined) {
          setPrice(priceValue.toString())
        }
      }
    } else if (assetType === "bank") {
      setSelectedBankCurrency(symbol)
      if (symbol.buy !== undefined) {
        // Alış/satış türüne göre fiyat belirle
        const priceValue = transactionType === "buy" ? symbol.buy : symbol.sell
        if (priceValue !== undefined) {
          setPrice(priceValue.toString())
        }
      }
    } else if (assetType === "crypto") {
      setSelectedCrypto(symbol)
      if (symbol.price) {
        // USDT fiyatını TL'ye çevir (yaklaşık 34 TL = 1 USD)
        const usdPrice = Number.parseFloat(symbol.price)
        const tlPrice = usdPrice * 34 // Sabit kur kullanıyoruz
        setPrice(tlPrice.toString())
      }
    }
  }

  // İşlem türü değiştiğinde fiyatı güncelle
  useEffect(() => {
    if (assetType === "gold" && selectedGold) {
      const priceValue = transactionType === "buy" ? selectedGold.buy : selectedGold.sell
      if (priceValue !== undefined) {
        setPrice(priceValue.toString())
      }
    } else if (assetType === "bank" && selectedBankCurrency) {
      const priceValue = transactionType === "buy" ? selectedBankCurrency.buy : selectedBankCurrency.sell
      if (priceValue !== undefined) {
        setPrice(priceValue.toString())
      }
    }
  }, [transactionType, selectedGold, selectedBankCurrency, assetType])

  const clearFormInputs = () => {
    setQuantity("")
    setPrice("")
    setTotalAmount("")
  }

  const handleSubmit = () => {
    let symbolCode = ""
    let symbolName = ""
    let symbolDetails = undefined

    if (assetType === "stock" && selectedSymbol) {
      symbolCode = selectedSymbol.code
      symbolName = selectedSymbol.securityDesc
      symbolDetails = selectedSymbol
    } else if (assetType === "currency" && selectedCurrency) {
      symbolCode = selectedCurrency.name
      symbolName = selectedCurrency.name
    } else if (assetType === "gold" && selectedGold) {
      symbolCode = selectedGold.name
      symbolName = selectedGold.name
    } else if (assetType === "bank" && selectedBankCurrency) {
      symbolCode = selectedBankCurrency.currencyCode
      symbolName = selectedBankCurrency.name
    } else if (assetType === "crypto" && selectedCrypto) {
      symbolCode = selectedCrypto.baseAsset
      symbolName = selectedCrypto.symbol
    }

    if (!symbolCode || !quantity || !price) {
      return
    }

    const quantityNum = Number.parseFloat(quantity)
    const priceNum = Number.parseFloat(price)

    // Satış kontrolü (sadece hisse için)
    if (assetType === "stock" && transactionType === "sell" && quantityNum > availableQuantity) {
      return
    }

    onAddTransaction({
      symbol: symbolCode,
      symbolName: symbolName,
      symbolDetails: symbolDetails,
      assetType: assetType,
      quantity: quantityNum,
      price: priceNum,
      type: transactionType,
    })

    // Sadece input alanlarını temizle, seçimleri koru
    clearFormInputs()

    // Döviz, altın, banka için seçimleri de temizle
    if (assetType !== "stock") {
      setSelectedCurrency(null)
      setSelectedGold(null)
      setSelectedBankCurrency(null)
      setSelectedCrypto(null)
    }
  }

  const getSelectedItem = () => {
    switch (assetType) {
      case "stock":
        return selectedSymbol
      case "currency":
        return selectedCurrency
      case "gold":
        return selectedGold
      case "bank":
        return selectedBankCurrency
      case "crypto":
        return selectedCrypto
      default:
        return null
    }
  }

  const isFormValid = getSelectedItem() && quantity && price

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Yeni İşlem Ekle
          </CardTitle>
          <CardDescription>Hisse senedi, döviz, altın veya banka dövizi işlemi ekleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset Type Selector */}
          <div className="space-y-2">
            <Label>Varlık Türü</Label>
            <ToggleGroup type="single" value={assetType} onValueChange={handleAssetTypeChange} className="w-full">
              <ToggleGroupItem value="stock" className="flex-1">
                <TrendingUp className="w-4 h-4 mr-2" />
                Hisse
              </ToggleGroupItem>
              <ToggleGroupItem value="currency" className="flex-1">
                <Coins className="w-4 h-4 mr-2" />
                Döviz
              </ToggleGroupItem>
              <ToggleGroupItem value="gold" className="flex-1">
                <Gem className="w-4 h-4 mr-2" />
                Altın
              </ToggleGroupItem>
              <ToggleGroupItem value="bank" className="flex-1">
                <Banknote className="w-4 h-4 mr-2" />
                Banka
              </ToggleGroupItem>
              <ToggleGroupItem value="crypto" className="flex-1">
                <Bitcoin className="w-4 h-4 mr-2" />
                Kripto
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Dynamic Selector */}
          <div className="space-y-2">
            <Label>
              {assetType === "stock" && "Hisse Kodu"}
              {assetType === "currency" && "Döviz"}
              {assetType === "gold" && "Altın Türü"}
              {assetType === "bank" && "Banka Dövizi"}
              {assetType === "crypto" && "Kripto Para"}
            </Label>
            {assetType === "stock" && (
              <StockSelector
                onSelect={handleSymbolSelect}
                selectedSymbol={selectedSymbol}
                placeholder="Lütfen hisse kodu seçiniz"
              />
            )}
            {assetType === "currency" && <CurrencySelector onSelect={handleSymbolSelect} apiData={apiData?.doviz} />}
            {assetType === "gold" && <GoldSelector onSelect={handleSymbolSelect} apiData={apiData?.manisaKuyum} />}
            {assetType === "bank" && (
              <BankCurrencySelector onSelect={handleSymbolSelect} apiData={apiData?.seninBankan} />
            )}
            {assetType === "crypto" && <CryptoSelector onSelect={handleSymbolSelect} selectedCrypto={selectedCrypto} />}

            {selectedSymbol && assetType === "stock" && transactionType === "sell" && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-blue-600">
                  Mevcut: {availableQuantity} adet
                </Badge>
                {availableQuantity === 0 && (
                  <span className="text-red-600 text-xs">Bu hisseden satılacak adet yok</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>İşlem Türü</Label>
            <div className="grid grid-cols-2 gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={transactionType === "buy" ? "default" : "outline"}
                    className={`h-12 ${transactionType === "buy" ? "bg-green-600 hover:bg-green-700" : ""}`}
                    onClick={() => setTransactionType("buy")}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Alış
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Satın alma işlemi</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={transactionType === "sell" ? "default" : "outline"}
                    className={`h-12 ${transactionType === "sell" ? "bg-red-600 hover:bg-red-700" : ""}`}
                    onClick={() => setTransactionType("sell")}
                    disabled={assetType === "stock" && selectedSymbol && availableQuantity === 0}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Satış
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Satma işlemi</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Adet</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="100"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  max={assetType === "stock" && transactionType === "sell" ? availableQuantity : undefined}
                  className={
                    assetType === "stock" &&
                    transactionType === "sell" &&
                    quantity &&
                    Number.parseFloat(quantity) > availableQuantity
                      ? "border-red-500"
                      : ""
                  }
                />
                {assetType === "stock" &&
                  transactionType === "sell" &&
                  quantity &&
                  Number.parseFloat(quantity) > availableQuantity && (
                    <p className="text-xs text-red-600">Mevcut adetten fazla girilemez</p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Fiyat (₺)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.0001"
                  placeholder="25.50"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Toplam Tutar (₺)
              </Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                placeholder="2550.00"
                value={totalAmount}
                onChange={(e) => handleTotalAmountChange(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`w-full h-12 text-base font-semibold ${
              transactionType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {transactionType === "buy" ? (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Alış Ekle
              </>
            ) : (
              <>
                <Minus className="w-5 h-5 mr-2" />
                Satış Ekle
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
