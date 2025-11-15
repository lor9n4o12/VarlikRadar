import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetAllocationChart } from "@/components/asset-allocation-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AssetAllocation, AssetDetail } from "@shared/schema";

export default function Reports() {
  const { data: allocation, isLoading: allocationLoading } = useQuery<AssetAllocation[]>({
    queryKey: ["/api/portfolio/allocation"],
  });

  const { data: assets, isLoading: assetsLoading } = useQuery<AssetDetail[]>({
    queryKey: ["/api/portfolio/details"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAssetsByType = (type: string) => {
    return assets?.filter((asset) => asset.type === type) || [];
  };

  const getTotalByType = (type: string) => {
    return getAssetsByType(type).reduce((sum, asset) => sum + (asset.totalValue || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="heading-reports">
          Raporlar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Portföyünüzün detaylı analizini görüntüleyin
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-allocation-report">
          <CardHeader>
            <CardTitle>Varlık Sınıfı Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationLoading ? (
              <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
            ) : (
              <AssetAllocationChart data={allocation || []} />
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-summary-by-type">
          <CardHeader>
            <CardTitle>Varlık Sınıfına Göre Özet</CardTitle>
          </CardHeader>
          <CardContent>
            {assetsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 w-full bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {["hisse", "etf", "kripto", "gayrimenkul"].map((type) => {
                  const total = getTotalByType(type);
                  const count = getAssetsByType(type).length;
                  const typeNames: Record<string, string> = {
                    hisse: "Hisse Senetleri",
                    etf: "ETF'ler",
                    kripto: "Kripto Paralar",
                    gayrimenkul: "Gayrimenkul",
                  };
                  
                  return (
                    <div key={type} className="flex items-center justify-between p-4 border rounded-md" data-testid={`summary-${type}`}>
                      <div>
                        <div className="font-medium">{typeNames[type]}</div>
                        <div className="text-sm text-muted-foreground">{count} varlık</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(total)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-detailed-breakdown">
        <CardHeader>
          <CardTitle>Detaylı Varlık Dökümü</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hisse" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hisse" data-testid="tab-hisse">Hisse</TabsTrigger>
              <TabsTrigger value="etf" data-testid="tab-etf">ETF</TabsTrigger>
              <TabsTrigger value="kripto" data-testid="tab-kripto">Kripto</TabsTrigger>
              <TabsTrigger value="gayrimenkul" data-testid="tab-gayrimenkul">Gayrimenkul</TabsTrigger>
            </TabsList>
            {["hisse", "etf", "kripto", "gayrimenkul"].map((type) => (
              <TabsContent key={type} value={type} className="mt-4">
                {assetsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-20 w-full bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getAssetsByType(type).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Bu kategoride varlık bulunmamaktadır
                      </div>
                    ) : (
                      getAssetsByType(type).map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-4 border rounded-md" data-testid={`asset-detail-${asset.id}`}>
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {asset.symbol} • {asset.market}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(asset.totalValue || 0)}</div>
                            <div className={`text-sm ${(asset.change || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                              {(asset.change || 0) >= 0 ? "+" : ""}{(asset.change || 0).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
