import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Transaction } from "@shared/schema";

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      TRY: "₺",
      USD: "$",
      EUR: "€",
    };
    return `${symbols[currency] || ""}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground" data-testid="empty-transactions">
        <p>Henüz işlem kaydı bulunmuyor</p>
        <p className="text-sm mt-1">İşlem eklemek için yukarıdaki butonu kullanın</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih</TableHead>
            <TableHead>Varlık ID</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead className="text-right">Miktar</TableHead>
            <TableHead className="text-right">Fiyat</TableHead>
            <TableHead className="text-right">Toplam</TableHead>
            <TableHead>Notlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
              <TableCell>
                {format(new Date(transaction.date), "d MMM yyyy", { locale: tr })}
              </TableCell>
              <TableCell className="font-mono text-xs">{transaction.assetId.slice(0, 8)}...</TableCell>
              <TableCell>
                <Badge
                  variant={transaction.type === "alış" ? "default" : "secondary"}
                  data-testid={`badge-${transaction.type}`}
                >
                  {transaction.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {Number(transaction.quantity).toLocaleString("tr-TR", { maximumFractionDigits: 8 })}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(Number(transaction.price), transaction.currency)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(Number(transaction.totalAmount), transaction.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {transaction.notes || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
