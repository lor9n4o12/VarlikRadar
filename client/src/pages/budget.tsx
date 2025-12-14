import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Income, Expense, BudgetSummary } from "@shared/schema";
import { incomeCategories, expenseCategories, insertIncomeSchema, insertExpenseSchema } from "@shared/schema";

const INCOME_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(142, 71%, 45%)",
  "hsl(160, 84%, 39%)",
  "hsl(161, 94%, 30%)",
  "hsl(173, 80%, 40%)",
  "hsl(174, 72%, 56%)",
];

const EXPENSE_COLORS = [
  "hsl(0, 84%, 60%)",
  "hsl(0, 72%, 51%)",
  "hsl(15, 75%, 50%)",
  "hsl(25, 95%, 53%)",
  "hsl(38, 92%, 50%)",
  "hsl(45, 93%, 47%)",
  "hsl(330, 81%, 60%)",
  "hsl(280, 65%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(221, 83%, 53%)",
  "hsl(199, 89%, 48%)",
];

const incomeCategoryLabels: Record<string, string> = {
  maaş: "Maaş",
  kira: "Kira Geliri",
  temettü: "Temettü",
  faiz: "Faiz",
  serbest: "Serbest Gelir",
  diğer: "Diğer",
};

const expenseCategoryLabels: Record<string, string> = {
  market: "Market",
  faturalar: "Faturalar",
  ulaşım: "Ulaşım",
  sağlık: "Sağlık",
  eğlence: "Eğlence",
  giyim: "Giyim",
  yemek: "Yemek",
  kira: "Kira",
  kredi: "Kredi",
  sigorta: "Sigorta",
  diğer: "Diğer",
};

const incomeFormSchema = insertIncomeSchema.extend({
  amount: z.coerce.number().positive("Tutar pozitif olmalıdır"),
});

const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.coerce.number().positive("Tutar pozitif olmalıdır"),
});

export default function Budget() {
  const { toast } = useToast();

  const { data: summary, isLoading: summaryLoading } = useQuery<BudgetSummary>({
    queryKey: ["/api/budget/summary"],
  });

  const { data: incomes, isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ["/api/incomes"],
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const incomeForm = useForm({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      category: "maaş",
      description: "",
      amount: 0,
      currency: "TRY",
      date: new Date(),
      isRecurring: 0,
    },
  });

  const expenseForm = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: "market",
      description: "",
      amount: 0,
      currency: "TRY",
      date: new Date(),
      isRecurring: 0,
    },
  });

  const createIncomeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof incomeFormSchema>) => {
      const response = await apiRequest("POST", "/api/incomes", {
        ...data,
        amount: data.amount.toString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/summary"] });
      incomeForm.reset();
      toast({ title: "Başarılı", description: "Gelir eklendi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Gelir eklenemedi", variant: "destructive" });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof expenseFormSchema>) => {
      const response = await apiRequest("POST", "/api/expenses", {
        ...data,
        amount: data.amount.toString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/summary"] });
      expenseForm.reset();
      toast({ title: "Başarılı", description: "Gider eklendi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Gider eklenemedi", variant: "destructive" });
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/incomes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/summary"] });
      toast({ title: "Başarılı", description: "Gelir silindi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Gelir silinemedi", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/summary"] });
      toast({ title: "Başarılı", description: "Gider silindi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Gider silinemedi", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("tr-TR");
  };

  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return new Date().toISOString().split('T')[0];
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
      return d.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const IncomePieChart = () => {
    const data = summary?.incomeByCategory || [];
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          Gelir verisi bulunmamaktadır
        </div>
      );
    }

    const chartData = data.map((item, index) => ({
      name: incomeCategoryLabels[item.category] || item.category,
      value: item.amount,
      percentage: item.percentage,
      fill: INCOME_COLORS[index % INCOME_COLORS.length],
    }));

    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`income-cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border rounded-md p-2 shadow-md">
                    <p className="font-medium">{payload[0].name}</p>
                    <p className="text-sm">{formatCurrency(payload[0].value as number)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const ExpensePieChart = () => {
    const data = summary?.expenseByCategory || [];
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          Gider verisi bulunmamaktadır
        </div>
      );
    }

    const chartData = data.map((item, index) => ({
      name: expenseCategoryLabels[item.category] || item.category,
      value: item.amount,
      percentage: item.percentage,
      fill: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
    }));

    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`expense-cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border rounded-md p-2 shadow-md">
                    <p className="font-medium">{payload[0].name}</p>
                    <p className="text-sm">{formatCurrency(payload[0].value as number)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="heading-budget">
          Bütçe Takibi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gelir ve giderlerinizi yönetin
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card data-testid="card-total-income">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-semibold text-success" data-testid="text-total-income">
                {formatCurrency(summary?.totalIncome || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-expense">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-semibold text-destructive" data-testid="text-total-expense">
                {formatCurrency(summary?.totalExpense || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Bakiye</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <div 
                className={`text-2xl font-semibold ${(summary?.balance || 0) >= 0 ? "text-success" : "text-destructive"}`}
                data-testid="text-balance"
              >
                {formatCurrency(summary?.balance || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-income-chart">
          <CardHeader>
            <CardTitle>Gelir Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-[250px] w-full bg-muted animate-pulse rounded" />
            ) : (
              <IncomePieChart />
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-expense-chart">
          <CardHeader>
            <CardTitle>Gider Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-[250px] w-full bg-muted animate-pulse rounded" />
            ) : (
              <ExpensePieChart />
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income" data-testid="tab-income">Gelirler</TabsTrigger>
          <TabsTrigger value="expense" data-testid="tab-expense">Giderler</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gelir Ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...incomeForm}>
                <form onSubmit={incomeForm.handleSubmit((data) => createIncomeMutation.mutate(data))} className="grid gap-4 md:grid-cols-5">
                  <FormField
                    control={incomeForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-income-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {incomeCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{incomeCategoryLabels[cat]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={incomeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                          <Input placeholder="Açıklama" {...field} data-testid="input-income-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={incomeForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tutar (₺)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-income-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={incomeForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarih</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={formatDateForInput(field.value)}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-income-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <Button type="submit" disabled={createIncomeMutation.isPending} data-testid="button-add-income">
                      <Plus className="h-4 w-4 mr-2" />
                      Ekle
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gelir Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {incomesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 w-full bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : incomes && incomes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomes.map((income) => (
                      <TableRow key={income.id} data-testid={`row-income-${income.id}`}>
                        <TableCell>{formatDate(income.date)}</TableCell>
                        <TableCell>{incomeCategoryLabels[income.category] || income.category}</TableCell>
                        <TableCell>{income.description}</TableCell>
                        <TableCell className="text-right text-success font-medium">
                          {formatCurrency(Number(income.amount))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteIncomeMutation.mutate(income.id)}
                            disabled={deleteIncomeMutation.isPending}
                            data-testid={`button-delete-income-${income.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz gelir kaydı bulunmamaktadır
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gider Ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...expenseForm}>
                <form onSubmit={expenseForm.handleSubmit((data) => createExpenseMutation.mutate(data))} className="grid gap-4 md:grid-cols-5">
                  <FormField
                    control={expenseForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-expense-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {expenseCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{expenseCategoryLabels[cat]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={expenseForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                          <Input placeholder="Açıklama" {...field} data-testid="input-expense-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={expenseForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tutar (₺)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-expense-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={expenseForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarih</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={formatDateForInput(field.value)}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-expense-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <Button type="submit" disabled={createExpenseMutation.isPending} data-testid="button-add-expense">
                      <Plus className="h-4 w-4 mr-2" />
                      Ekle
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gider Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 w-full bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : expenses && expenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{expenseCategoryLabels[expense.category] || expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell className="text-right text-destructive font-medium">
                          {formatCurrency(Number(expense.amount))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExpenseMutation.mutate(expense.id)}
                            disabled={deleteExpenseMutation.isPending}
                            data-testid={`button-delete-expense-${expense.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz gider kaydı bulunmamaktadır
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
