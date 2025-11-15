import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { TransactionTable } from "@/components/transaction-table";
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground" data-testid="heading-transactions">
            İşlemler
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Alım ve satım işlemlerinizi görüntüleyin
          </p>
        </div>
        <Button onClick={() => setIsAddTransactionOpen(true)} data-testid="button-add-transaction">
          <Plus className="h-4 w-4 mr-2" />
          İşlem Ekle
        </Button>
      </div>

      <Card data-testid="card-transaction-history">
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              İşlemler yüklenirken bir hata oluştu
            </div>
          ) : (
            <TransactionTable transactions={transactions || []} />
          )}
        </CardContent>
      </Card>

      <AddTransactionDialog 
        open={isAddTransactionOpen} 
        onOpenChange={setIsAddTransactionOpen} 
      />
    </div>
  );
}
