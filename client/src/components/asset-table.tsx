import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AssetDetail } from "@shared/schema";

interface AssetTableProps {
  assets: AssetDetail[];
}

export function AssetTable({ assets }: AssetTableProps) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/assets/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/allocation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/performance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/details"] });
      toast({
        title: "Başarılı",
        description: "Varlık başarıyla silindi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Varlık silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number | undefined, currency: string) => {
    const symbols: Record<string, string> = {
      TRY: "₺",
      USD: "$",
      EUR: "€",
    };
    const value = amount ?? 0;
    return `${symbols[currency] || ""}${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
  };

  const assetTypeNames: Record<string, string> = {
    hisse: "Hisse",
    etf: "ETF",
    kripto: "Kripto",
    gayrimenkul: "Gayrimenkul",
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground" data-testid="empty-assets">
        <p>Henüz varlık eklenmemiş</p>
        <p className="text-sm mt-1">Portföyünüze varlık eklemek için yukarıdaki butonu kullanın</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Varlık</TableHead>
            <TableHead>Tip</TableHead>
            <TableHead>Borsa</TableHead>
            <TableHead className="text-right">Miktar</TableHead>
            <TableHead className="text-right">Ort. Fiyat</TableHead>
            <TableHead className="text-right">Güncel Fiyat</TableHead>
            <TableHead className="text-right">Toplam Değer</TableHead>
            <TableHead className="text-right">Değişim</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id} data-testid={`asset-row-${asset.id}`}>
              <TableCell className="font-medium">
                <div>
                  <div>{asset.name}</div>
                  <div className="text-sm text-muted-foreground">{asset.symbol}</div>
                </div>
              </TableCell>
              <TableCell>{assetTypeNames[asset.type] || asset.type}</TableCell>
              <TableCell>{asset.market}</TableCell>
              <TableCell className="text-right">{Number(asset.quantity).toLocaleString("tr-TR", { maximumFractionDigits: 8 })}</TableCell>
              <TableCell className="text-right">{formatCurrency(Number(asset.averagePrice), asset.currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(Number(asset.currentPrice), asset.currency)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(asset.totalValue, asset.currency)}</TableCell>
              <TableCell className="text-right">
                <div className={`flex items-center justify-end gap-1 ${asset.change >= 0 ? "text-success" : "text-destructive"}`}>
                  {asset.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{formatPercent(asset.change)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(asset.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${asset.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
