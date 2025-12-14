import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAssetSchema, type InsertAsset } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
  const { toast } = useToast();
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  
  const form = useForm<InsertAsset>({
    resolver: zodResolver(insertAssetSchema),
    defaultValues: {
      type: "hisse",
      name: "",
      symbol: "",
      market: "BIST",
      quantity: "0",
      averagePrice: "0",
      currentPrice: "0",
      currency: "TRY",
    },
  });

  const fetchCurrentPrice = async () => {
    const symbol = form.getValues("symbol");
    const type = form.getValues("type");
    const market = form.getValues("market");

    if (!symbol) {
      toast({
        title: "Uyarı",
        description: "Lütfen önce sembol giriniz",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingPrice(true);
    try {
      const response = await fetch(`/api/prices/${symbol}?type=${type}&market=${market}`);
      if (response.ok) {
        const data = await response.json();
        form.setValue("currentPrice", data.price.toFixed(2));
        toast({
          title: "Fiyat Güncellendi",
          description: `${symbol} güncel fiyatı: ${data.price.toFixed(2)}`,
        });
      } else {
        toast({
          title: "Fiyat Bulunamadı",
          description: "Bu sembol için fiyat bilgisi alınamadı",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fiyat bilgisi alınırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertAsset) => {
      return await apiRequest("POST", "/api/assets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/allocation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/performance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/details"] });
      toast({
        title: "Başarılı",
        description: "Varlık başarıyla eklendi",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.message || "Varlık eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAsset) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" data-testid="dialog-add-asset">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Yeni Varlık Ekle</DialogTitle>
              <DialogDescription>
                Portföyünüze yeni bir varlık ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Varlık Türü</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hisse">Hisse Senedi</SelectItem>
                          <SelectItem value="etf">ETF</SelectItem>
                          <SelectItem value="kripto">Kripto Para</SelectItem>
                          <SelectItem value="gayrimenkul">Gayrimenkul</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="market"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Borsa</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-market">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BIST">Borsa İstanbul</SelectItem>
                          <SelectItem value="US">Amerikan Borsası</SelectItem>
                          <SelectItem value="Diğer">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Varlık Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="örn: Türk Hava Yolları" {...field} data-testid="input-asset-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sembol/Ticker</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="örn: THYAO" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        data-testid="input-asset-symbol" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miktar</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.00000001" placeholder="0" {...field} data-testid="input-quantity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Para Birimi</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TRY">TRY (₺)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="averagePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ortalama Alış Fiyatı</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-average-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Güncel Fiyat</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-current-price" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={fetchCurrentPrice}
                          disabled={isFetchingPrice}
                          data-testid="button-fetch-price"
                        >
                          <RefreshCw className={`h-4 w-4 ${isFetchingPrice ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                İptal
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                {createMutation.isPending ? "Ekleniyor..." : "Varlık Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
