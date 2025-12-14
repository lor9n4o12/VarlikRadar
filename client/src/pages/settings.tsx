import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useDisplayCurrency } from "@/lib/currency-context";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  const [language, setLanguage] = useState("tr");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="heading-settings">
          Ayarlar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform tercihlerinizi yönetin
        </p>
      </div>

      <Card data-testid="card-appearance">
        <CardHeader>
          <CardTitle>Görünüm</CardTitle>
          <CardDescription>Platform görünüm ayarlarını özelleştirin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Karanlık Mod</Label>
              <div className="text-sm text-muted-foreground">
                Koyu tema kullan
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-regional">
        <CardHeader>
          <CardTitle>Bölgesel Ayarlar</CardTitle>
          <CardDescription>Para birimi ve dil tercihlerinizi ayarlayın</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Ana Para Birimi</Label>
            <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
              <SelectTrigger id="currency" data-testid="select-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
                <SelectItem value="USD">Amerikan Doları ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="BTC">Bitcoin (₿)</SelectItem>
                <SelectItem value="ETH">Ethereum (Ξ)</SelectItem>
                <SelectItem value="XAU">Gram Altın (gr)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Portföy özetinde kullanılacak ana para birimi
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Dil</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tr">Türkçe</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Platform arayüz dili
            </p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-notifications">
        <CardHeader>
          <CardTitle>Bildirimler</CardTitle>
          <CardDescription>Bildirim tercihlerinizi yönetin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="price-alerts">Fiyat Uyarıları</Label>
              <div className="text-sm text-muted-foreground">
                Fiyat değişikliklerinde bildirim al
              </div>
            </div>
            <Switch id="price-alerts" data-testid="switch-price-alerts" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="portfolio-updates">Portföy Güncellemeleri</Label>
              <div className="text-sm text-muted-foreground">
                Günlük portföy özeti bildirimleri
              </div>
            </div>
            <Switch id="portfolio-updates" data-testid="switch-portfolio-updates" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
