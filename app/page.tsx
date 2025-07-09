"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Building2,
  RefreshCw,
  Wallet,
  PiggyBank,
  BarChart3,
  Clock,
  Coins,
  Gem,
  Banknote,
  Copy,
  Bitcoin,
} from "lucide-react"
import { TransactionForm } from "@/components/transaction-form"
import { TransactionHistory } from "@/components/transaction-history"
import { SettingsAccordion } from "@/components/settings-accordion"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

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

interface StockSummary {
  symbol: string
  symbolDetails?: StockSymbol
  assetType: "stock" | "currency" | "gold" | "bank"
  totalQuantity: number
  averageCost: number
  totalCost: number
  currentPrice: number
  marketValue: number
  profitLoss: number
  profitLossPercentage: number
}

interface StockPrice {
  symbol: string
  last: number
  dailyChange: number
  dailyChangePercent: number
}

interface CurrencyPrice {
  name: string
  value: number
}

interface GoldPrice {
  name: string
  buy: number
  sell: number
}

interface BankCurrencyPrice {
  currencyCode: string
  name: string
  buy: number
  sell: number
  change: number
}

interface CryptoPrice {
  symbol: string
  price: string
}

export default function StockCostCalculator() {
  const [transactions, setTransactions] = useLocalStorage<StockTransaction[]>("stock-transactions", [])
  const [stockPrices, setStockPrices] = useState<Record<string, StockPrice>>({})
  const [currencyPrices, setCurrencyPrices] = useState<Record<string, CurrencyPrice>>({})
  const [goldPrices, setGoldPrices] = useState<Record<string, GoldPrice>>({})
  const [bankCurrencyPrices, setBankCurrencyPrices] = useState<Record<string, BankCurrencyPrice>>({})
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoPrice>>({})
  const [apiData, setApiData] = useState<any>(null)
  const [pricesLoading, setPricesLoading] = useState(false)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useLocalStorage("auto-refresh", false)
  const [refreshInterval, setRefreshInterval] = useLocalStorage("refresh-interval", "30")

  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Güncel fiyatları çek
  const fetchCurrentPrices = useCallback(async () => {
    const uniqueStocks = [...new Set(transactions.filter((t) => t.assetType === "stock").map((t) => t.symbol))]
    const hasCurrency = transactions.some((t) => t.assetType === "currency")
    const hasGold = transactions.some((t) => t.assetType === "gold")
    const hasBank = transactions.some((t) => t.assetType === "bank")
    const hasCrypto = transactions.some((t) => t.assetType === "crypto")

    if (uniqueStocks.length === 0 && !hasCurrency && !hasGold && !hasBank && !hasCrypto) return

    setPricesLoading(true)
    try {
      const promises = []

      // Hisse fiyatları
      if (uniqueStocks.length > 0) {
        const symbolsString = uniqueStocks.join(",")
        promises.push(
          fetch(`https://publicapi.ramazansancar.com.tr/foreks/symbols/${symbolsString}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.data) {
                const pricesMap: Record<string, StockPrice> = {}
                data.data.forEach((stock: any) => {
                  if (stock.symbol && stock.last) {
                    pricesMap[stock.symbol] = {
                      symbol: stock.symbol,
                      last: stock.last,
                      dailyChange: stock.dailyChange || 0,
                      dailyChangePercent: ((stock.dailyChange || 0) / (stock.last - (stock.dailyChange || 0))) * 100,
                    }
                  }
                })
                setStockPrices(pricesMap)
              }
            }),
        )
      }

      // Döviz, altın, banka fiyatları - her zaman güncelle
      promises.push(
        fetch("https://borsa.ramazansancar.com.tr/api/")
          .then((res) => res.json())
          .then((data) => {
            if (data.status === "success") {
              // API verilerini güncelle
              setApiData(data.datas)

              // Döviz fiyatları
              if (data.datas.doviz) {
                const currencyMap: Record<string, CurrencyPrice> = {}
                data.datas.doviz.data.forEach((currency: any) => {
                  currencyMap[currency.name] = {
                    name: currency.name,
                    value: currency.value,
                  }
                })
                setCurrencyPrices(currencyMap)
              }

              // Altın fiyatları - artık number olarak geliyor
              if (data.datas.manisaKuyum) {
                const goldMap: Record<string, GoldPrice> = {}
                data.datas.manisaKuyum.data.forEach((gold: any) => {
                  goldMap[gold.name] = {
                    name: gold.name,
                    buy: gold.buy,
                    sell: gold.sell,
                  }
                })
                setGoldPrices(goldMap)
              }

              // Banka döviz fiyatları
              if (data.datas.seninBankan) {
                const bankMap: Record<string, BankCurrencyPrice> = {}
                data.datas.seninBankan.data.forEach((bank: any) => {
                  bankMap[bank.currencyCode] = {
                    currencyCode: bank.currencyCode,
                    name: bank.name,
                    buy: bank.buy,
                    sell: bank.sell,
                    change: bank.change,
                  }
                })
                setBankCurrencyPrices(bankMap)
              }
            }
          }),
      )

      // Kripto fiyatları
      if (hasCrypto) {
        const uniqueCryptos = [
          ...new Set(transactions.filter((t) => t.assetType === "crypto").map((t) => t.symbolName)),
        ]
        if (uniqueCryptos.length > 0) {
          promises.push(
            fetch("https://api.binance.com/api/v3/ticker/price")
              .then((res) => res.json())
              .then((data) => {
                if (Array.isArray(data)) {
                  const cryptoMap: Record<string, CryptoPrice> = {}
                  data.forEach((crypto: any) => {
                    if (uniqueCryptos.includes(crypto.symbol)) {
                      cryptoMap[crypto.symbol] = {
                        symbol: crypto.symbol,
                        price: crypto.price,
                      }
                    }
                  })
                  setCryptoPrices(cryptoMap)
                }
              }),
          )
        }
      }

      await Promise.all(promises)
      setLastPriceUpdate(new Date())

      toast({
        title: "🔄 Güncellendi",
        description: "Fiyatlar güncellendi",
        className: "border-blue-500 bg-blue-50 text-blue-900",
      })
    } catch (error) {
      console.error("Fiyatlar alınırken hata:", error)
      toast({
        title: "❌ Hata",
        description: "Fiyatlar güncellenirken hata oluştu",
        variant: "destructive",
      })
    } finally {
      setPricesLoading(false)
    }
  }, [transactions, toast])

  // İlk yükleme için API verilerini çek
  useEffect(() => {
    const fetchInitialApiData = async () => {
      try {
        const response = await fetch("https://borsa.ramazansancar.com.tr/api/")
        const data = await response.json()
        if (data.status === "success") {
          setApiData(data.datas)
        }
      } catch (error) {
        console.error("API verileri alınırken hata:", error)
      }
    }

    fetchInitialApiData()
  }, [])

  // Otomatik güncelleme
  useEffect(() => {
    if (!autoRefresh || transactions.length === 0) return

    const interval = setInterval(() => {
      fetchCurrentPrices()
    }, Number.parseInt(refreshInterval) * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchCurrentPrices, transactions.length])

  // Sayfa yüklendiğinde ve işlemler değiştiğinde fiyatları çek
  useEffect(() => {
    if (transactions.length > 0) {
      fetchCurrentPrices()
    }
  }, [transactions.length])

  const addTransaction = (transactionData: Omit<StockTransaction, "id" | "date" | "createdAt">) => {
    const transaction: StockTransaction = {
      ...transactionData,
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    }

    setTransactions([...transactions, transaction])

    toast({
      title: "✅ Başarılı",
      description: `${transaction.type === "buy" ? "Alım" : "Satım"} işlemi eklendi`,
      className: "border-green-500 bg-green-50 text-green-900",
    })
  }

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id))
    toast({
      title: "✅ Başarılı",
      description: "İşlem silindi",
      className: "border-green-500 bg-green-50 text-green-900",
    })
  }

  const getCurrentPrice = (transaction: StockTransaction): number => {
    switch (transaction.assetType) {
      case "stock":
        return stockPrices[transaction.symbol]?.last || 0
      case "currency":
        return currencyPrices[transaction.symbol]?.value || 0
      case "gold":
        // Artık altın fiyatları number olarak geliyor
        const goldPrice = goldPrices[transaction.symbol]?.buy
        return goldPrice || 0
      case "bank":
        return bankCurrencyPrices[transaction.symbol]?.buy || 0
      case "crypto":
        const cryptoPrice = cryptoPrices[transaction.symbolName]?.price
        if (cryptoPrice) {
          // USDT fiyatını TL'ye çevir
          const usdPrice = Number.parseFloat(cryptoPrice)
          return usdPrice * 34 // Sabit kur
        }
        return 0
      default:
        return 0
    }
  }

  const calculateStockSummary = (): StockSummary[] => {
    const stockGroups = transactions.reduce(
      (acc, transaction) => {
        const key = `${transaction.symbol}-${transaction.assetType}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(transaction)
        return acc
      },
      {} as Record<string, StockTransaction[]>,
    )

    return Object.entries(stockGroups).map(([key, txns]) => {
      let totalQuantity = 0
      let totalCost = 0

      txns.forEach((txn) => {
        if (txn.type === "buy") {
          totalQuantity += txn.quantity
          totalCost += txn.quantity * txn.price
        } else {
          totalQuantity -= txn.quantity
          if (totalQuantity + txn.quantity > 0) {
            totalCost -= txn.quantity * (totalCost / (totalQuantity + txn.quantity))
          }
        }
      })

      const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0
      const currentPrice = getCurrentPrice(txns[0])
      const marketValue = totalQuantity * currentPrice
      const profitLoss = marketValue - totalCost
      const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0

      return {
        symbol: txns[0].symbol,
        symbolDetails: txns[0].symbolDetails,
        assetType: txns[0].assetType,
        totalQuantity,
        averageCost,
        totalCost,
        currentPrice,
        marketValue,
        profitLoss,
        profitLossPercentage: isNaN(profitLossPercentage) ? 0 : profitLossPercentage,
      }
    })
  }

  const handleCopyPortfolio = async () => {
    const activeStocks = stockSummaries.filter((stock) => stock.totalQuantity > 0)

    if (activeStocks.length === 0) return

    const portfolioText = activeStocks
      .map((stock) => {
        const assetEmoji =
          stock.assetType === "stock"
            ? "📈"
            : stock.assetType === "currency"
              ? "💱"
              : stock.assetType === "gold"
                ? "🥇"
                : stock.assetType === "crypto"
                  ? "₿"
                  : "🏦"

        const profitEmoji = stock.profitLoss >= 0 ? "📈" : "📉"
        const profitText = stock.profitLoss >= 0 ? "Kar" : "Zarar"

        return `${assetEmoji} ${stock.symbol}
💰 Adet: ${stock.totalQuantity}
💵 Ort. Maliyet: ${formatCurrency(stock.averageCost)}
📊 Güncel Fiyat: ${formatCurrency(stock.currentPrice)}
${profitEmoji} ${profitText}: ${formatCurrency(Math.abs(stock.profitLoss))} (${stock.profitLossPercentage >= 0 ? "+" : ""}${stock.profitLossPercentage.toFixed(2)}%)`
      })
      .join("\n\n")

    const summary = `🎯 PORTFÖY ÖZETİ 🎯

${portfolioText}

💼 TOPLAM ÖZET:
💰 Portföy Değeri: ${formatCurrency(totalPortfolioValue)}
💸 Toplam Maliyet: ${formatCurrency(totalCost)}
${totalProfitLoss >= 0 ? "📈" : "📉"} Toplam ${totalProfitLoss >= 0 ? "Kar" : "Zarar"}: ${formatCurrency(Math.abs(totalProfitLoss))} (${totalProfitLoss >= 0 ? "+" : ""}${totalProfitLossPercentage.toFixed(2)}%)
📊 Toplam İşlem: ${transactions.length}

📱 Bu rapor https://portfoy-takip.vercel.app adresinden oluşturulmuştur.
🚀 Ücretsiz portföy takip sistemi - Hisse, kripto, döviz, altın takibi`

    try {
      await navigator.clipboard.writeText(summary)
      toast({
        title: "✅ Başarılı",
        description: "Portföy özeti panoya kopyalandı",
        className: "border-green-500 bg-green-50 text-green-900",
      })
    } catch (error) {
      toast({
        title: "❌ Hata",
        description: "Kopyalama başarısız",
        variant: "destructive",
      })
    }
  }

  const stockSummaries = calculateStockSummary()
  const totalPortfolioValue = stockSummaries.reduce((sum, stock) => sum + stock.marketValue, 0)
  const totalCost = stockSummaries.reduce((sum, stock) => sum + stock.totalCost, 0)
  const totalProfitLoss = totalPortfolioValue - totalCost
  const totalProfitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0

  // Portföyde varlık var mı kontrol et
  const hasPortfolioAssets = transactions.length > 0

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatSectorNames = (sectorName: string) => {
    if (!sectorName) return ["Diğer"]

    // Backslash'leri temizle ve virgülle ayır
    const sectors = sectorName
      .replace(/\\/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s)
    return sectors.length > 0 ? sectors : ["Diğer"]
  }

  const renderSectorBadges = (sectorName: string) => {
    const sectors = formatSectorNames(sectorName)

    if (sectors.length <= 3) {
      return sectors.map((sector, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {sector}
        </Badge>
      ))
    } else {
      const visibleSectors = sectors.slice(0, 3)
      const remainingCount = sectors.length - 3

      return (
        <>
          {visibleSectors.map((sector, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {sector}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs bg-gray-100">
            +{remainingCount}
          </Badge>
        </>
      )
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Calculator className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Portföy Takip Sistemi</h1>
              </div>
              <p className="text-gray-600">Hisse senedi, döviz, altın ve banka dövizi işlemlerinizi takip edin</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Otomatik Güncelleme Kontrolü */}
              <Card className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="auto-refresh"
                      checked={autoRefresh}
                      onCheckedChange={setAutoRefresh}
                      disabled={!hasPortfolioAssets}
                    />
                    <Label htmlFor="auto-refresh" className="text-sm">
                      Otomatik
                    </Label>
                  </div>
                  <Select value={refreshInterval} onValueChange={setRefreshInterval} disabled={!autoRefresh}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15s</SelectItem>
                      <SelectItem value="30">30s</SelectItem>
                      <SelectItem value="60">1dk</SelectItem>
                      <SelectItem value="300">5dk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCurrentPrices}
                    disabled={pricesLoading || !hasPortfolioAssets}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${pricesLoading ? "animate-spin" : ""}`} />
                    Fiyat Güncelle
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {!hasPortfolioAssets
                      ? "Portföyde varlık yok"
                      : lastPriceUpdate
                        ? `Son güncelleme: ${formatTime(lastPriceUpdate)}`
                        : "Güncel fiyatları çek"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Gecikme Uyarısı */}
          {transactions.length > 0 && (
            <Alert variant="warning">
              <Clock className="h-4 w-4" />
              <AlertTitle>Veri Gecikme Uyarısı</AlertTitle>
              <AlertDescription>
                Hisse fiyatları 15 dakika gecikmeli olarak sunulmaktadır. Gerçek zamanlı işlem yapmak için resmi borsa
                verilerini kullanın.
              </AlertDescription>
            </Alert>
          )}

          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  Toplam Portföy Değeri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPortfolioValue)}</div>
                {pricesLoading && <div className="text-xs text-gray-500 mt-1">Güncelleniyor...</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-orange-600" />
                  Toplam Maliyet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Toplam Kar/Zarar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold flex items-center gap-1 ${
                    totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totalProfitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {formatCurrency(Math.abs(totalProfitLoss))}
                </div>
                <div className={`text-sm ${totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totalProfitLoss >= 0 ? "+" : ""}
                  {totalProfitLossPercentage.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Toplam İşlem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
                <div className="text-xs text-gray-500">
                  {transactions.filter((t) => t.type === "buy").length} alış,{" "}
                  {transactions.filter((t) => t.type === "sell").length} satış
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Form */}
            <TransactionForm onAddTransaction={addTransaction} transactions={transactions} apiData={apiData} />

            {/* Stock Summaries */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Portföy Özeti</CardTitle>
                    <CardDescription>Portföyünüzdeki varlıkların detaylı analizi</CardDescription>
                  </div>
                  {stockSummaries.filter((stock) => stock.totalQuantity > 0).length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyPortfolio}
                          className="h-8 w-8 p-0 bg-transparent"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Portföy özetini kopyala</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {stockSummaries.filter((stock) => stock.totalQuantity > 0).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Henüz işlem eklenmemiş</p>
                ) : (
                  <ScrollArea className="h-[32rem]">
                    <div className="space-y-4 pr-4">
                      {stockSummaries
                        .filter((stock) => stock.totalQuantity > 0)
                        .map((stock) => {
                          const isProfit = stock.profitLoss >= 0
                          return (
                            <div
                              key={`${stock.symbol}-${stock.assetType}`}
                              className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-12 h-12">
                                    {stock.assetType === "stock" ? (
                                      <AvatarImage
                                        src={getIconUrl(stock.symbol) || "/placeholder.svg"}
                                        alt={stock.symbol}
                                      />
                                    ) : null}
                                    <AvatarFallback>{getAssetIcon(stock.assetType)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                                      {stock.assetType === "stock" && stock.symbolDetails?.sectorDesc?.name ? (
                                        <div className="flex gap-1 flex-wrap">
                                          {renderSectorBadges(stock.symbolDetails.sectorDesc.name)}
                                        </div>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">
                                          {stock.assetType === "currency"
                                            ? "Döviz"
                                            : stock.assetType === "gold"
                                              ? "Altın"
                                              : stock.assetType === "crypto"
                                                ? "Kripto"
                                                : "Banka"}
                                        </Badge>
                                      )}
                                    </div>
                                    {stock.symbolDetails && (
                                      <>
                                        <p className="text-sm font-medium text-gray-700 truncate">
                                          {stock.symbolDetails.securityDesc}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                          {stock.symbolDetails.issuerName}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`font-semibold ${
                                    isProfit
                                      ? "text-green-700 border-green-300 bg-green-50"
                                      : "text-red-700 border-red-300 bg-red-50"
                                  }`}
                                >
                                  {isProfit ? "+" : ""}
                                  {stock.profitLossPercentage.toFixed(2)}%
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Toplam Adet</p>
                                  <p className="font-medium">{stock.totalQuantity}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Ortalama Maliyet</p>
                                  <p className="font-medium">{formatCurrency(stock.averageCost)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Güncel Fiyat</p>
                                  <p className="font-medium">
                                    {formatCurrency(stock.currentPrice)}
                                    {pricesLoading && <span className="text-xs text-gray-400 ml-1">...</span>}
                                  </p>
                                </div>
                                {stock.assetType === "stock" && (
                                  <div>
                                    <p className="text-gray-600">Piyasa Değeri</p>
                                    <p className="font-medium">{formatCurrency(stock.marketValue)}</p>
                                  </div>
                                )}
                                <div className={stock.assetType === "stock" ? "col-span-2" : ""}>
                                  <p className="text-gray-600">Kar/Zarar</p>
                                  <p className={`font-bold text-lg ${isProfit ? "text-green-600" : "text-red-600"}`}>
                                    {isProfit ? "+" : ""}
                                    {formatCurrency(Math.abs(stock.profitLoss))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <TransactionHistory transactions={transactions} onRemoveTransaction={removeTransaction} />

          {/* Settings Accordion */}
          <SettingsAccordion
            transactions={transactions}
            onImportTransactions={setTransactions}
            onClearAllData={() => setTransactions([])}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
