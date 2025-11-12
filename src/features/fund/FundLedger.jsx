// src/features/fund/FundLedger.jsx
import { useState, useEffect } from "react";
import {
  getFundSummary,
  getTransactions,
  addTransaction,
  deleteTransaction
} from "@/services/fundService";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddTransactionForm } from "./AddTransactionForm"; // Chúng ta sẽ tạo file này ngay sau
import { Skeleton } from "@/components/ui/skeleton";
import { FundTransactionCard } from "./FundTransactionCard";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth.js";
// Hàm helper định dạng tiền tệ
const formatCurrency = (number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(number);
};

export function FundLedger() {
  const [summary, setSummary] = useState({ currentBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);

  const { userDocument } = useAuth();
  const userRole = userDocument?.role;
  const canManageFund = userRole === 'admin' || userRole === 'accounting';
  // Hàm fetch dữ liệu
  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryData, transData] = await Promise.all([
        getFundSummary(),
        getTransactions(),
      ]);
      setSummary(summaryData);
      setTransactions(transData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu sổ quỹ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Callback khi thêm giao dịch thành công
 const handleTransactionAdded = (newTransaction) => {
    setOpenAddDialog(false);
    // Cập nhật state (thêm vào đầu danh sách)
    setSummary({ currentBalance: newTransaction.balanceAfter });
    // Thêm vào danh sách đã sắp xếp (mới nhất lên trên)
    setTransactions((prev) => [newTransaction, ...prev]
      .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
    );
  };
    const handleDeleteConfirm = async () => {
        if (!txToDelete) return;
        try {
        await deleteTransaction(txToDelete);
        setTxToDelete(null);
        // Fetch lại dữ liệu sau khi xóa và tính toán lại
        fetchData(); 
        } catch (error) {
        console.error("Lỗi khi xóa:", error);
        setTxToDelete(null);
        }
    };
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        {/* Skeleton cho số dư */}
        <div className="mb-6">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Skeleton cho nút */}
        <Skeleton className="h-10 w-40 mb-8" />
        
        {/* Skeleton cho Bảng */}
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <div className="container mx-auto p-4">
        {/* 1. Hiển thị số dư */}
        <div className="mb-6">
            <h2 className="text-lg text-muted-foreground">Số dư hiện tại</h2>
            <p className="text-4xl font-bold text-blue-600">
            {formatCurrency(summary.currentBalance)}
            </p>
        </div>

        {/* 2. Nút thêm giao dịch */}
        {canManageFund && (
          <DialogTrigger asChild>
            <Button className="hidden md:inline-flex mb-6">Tạo giao dịch mới</Button>
          </DialogTrigger>
        )}

        {/* 3. Nút FAB cho MOBILE */}
        {canManageFund && (
          <DialogTrigger asChild>
            <Button
              className="md:hidden fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-10"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
        )}

        {/* 3. Bảng lịch sử giao dịch */}
        <h3 className="text-2xl font-bold mt-8 mb-4">Lịch sử giao dịch</h3>
        <Table className="hidden md:table">
            <TableHeader>
            <TableRow>
                <TableHead>Nội dung</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="text-right text-green-600">Thu</TableHead>
                <TableHead className="text-right text-red-600">Chi</TableHead>
                <TableHead className="text-right">Số dư</TableHead>
                {canManageFund && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
            </TableHeader>
            <TableBody>
            {transactions.map((t) => (
                <TableRow key={t.id}>
                <TableCell>{t.description}</TableCell>
                <TableCell>
                    {t.timestamp.toDate().toLocaleString("vi-VN")}
                </TableCell>
                <TableCell className="text-right text-green-600">
                    {t.type === "thu" ? formatCurrency(t.amount) : ""}
                </TableCell>
                <TableCell className="text-right text-red-600">
                    {t.type === "chi" ? formatCurrency(t.amount) : ""}
                </TableCell>
                <TableCell className="text-right font-medium">
                    {formatCurrency(t.balanceAfter)}
                </TableCell>
                {canManageFund && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem 
                          onClick={() => setTxToDelete(t)} 
                          className="text-red-500"
                        >
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
                </TableRow>
            ))}
            </TableBody>
        </Table>
        <div className="space-y-4 md:hidden"> {/* <-- Chỉ hiện trên mobile */}
            {transactions.map((t) => (
            <FundTransactionCard 
                key={t.id} 
                transaction={t}  
                onDelete={() => setTxToDelete(t)}
                canManage={canManageFund}
            />
            ))}
        </div>
        </div>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo giao dịch mới</DialogTitle>
        </DialogHeader>
        <AddTransactionForm 
          onSubmit={addTransaction}
          onSuccess={handleTransactionAdded} 
        />
      </DialogContent>
      <AlertDialog open={!!txToDelete} onOpenChange={() => setTxToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa giao dịch <strong>"{txToDelete?.description}"</strong> 
              và tính toán lại toàn bộ số dư lũy kế.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}