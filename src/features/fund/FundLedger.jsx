// src/features/fund/FundLedger.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { AddTransactionForm } from "./AddTransactionForm";
import { Skeleton } from "@/components/ui/skeleton";
import { FundTransactionCard } from "./FundTransactionCard";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth.js";
import { ScrollHideFab } from "@/components/common/ScrollHideFab";

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

  const { currentUser } = useAuth();
  const userRole = currentUser?.role;
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
    // Delay 300ms trước khi fetch để tránh giật lag khi chuyển nav nhanh
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  // Real-time updates
  const { socket } = useAuth();
  useEffect(() => {
    if (!socket) return;

    const handleFundUpdate = () => {
      console.log("Fund updated via socket, refreshing...");
      fetchData();
    };

    socket.on("fund:updated", handleFundUpdate);

    return () => {
      socket.off("fund:updated", handleFundUpdate);
    };
  }, [socket]);

  // Callback khi thêm giao dịch thành công
  const handleTransactionAdded = (newTransaction) => {
    setOpenAddDialog(false);
    // Cập nhật state (thêm vào đầu danh sách)
    setSummary({ currentBalance: newTransaction.balanceAfter });
    // Thêm vào danh sách đã sắp xếp (mới nhất lên trên)
    setTransactions((prev) => [newTransaction, ...prev]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );
  };

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    try {
      await deleteTransaction(txToDelete);
      setTxToDelete(null);
      // Fetch lại dữ liệu sau khi xóa và tính toán lại
      fetchData();
      toast.success("Xóa giao dịch thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      setTxToDelete(null);
      toast.error("Xóa giao dịch thất bại.");
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
          <p className="text-3xl md:text-4xl font-bold text-blue-600">
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
            <ScrollHideFab icon={Plus} className="md:hidden" />
          </DialogTrigger>
        )}

        {/* 3. Bảng lịch sử giao dịch */}
        <h3 className="text-xl md:text-2xl font-bold mt-8 mb-4">Lịch sử giao dịch</h3>
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
                  {new Date(t.timestamp).toLocaleString("vi-VN")}
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
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}