// src/pages/DashboardPage.jsx
// force update
import { useState, useEffect } from "react"; // <-- THÊM
import { motion } from "framer-motion";
import { UpcomingEvents } from "@/features/dashboard/UpcomingEvents";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // <-- THÊM
import { Skeleton } from "@/components/ui/skeleton"; // <-- THÊM
import { DollarSign, User } from "lucide-react"; // <-- THÊM
import { getFundSummary } from "@/services/fundService"; // <-- THÊM
import { getRotationData } from "@/services/dutyService"; // <-- THÊM
import { formatCurrency } from "@/lib/utils"; // <-- THÊM (từ Bước 1)

// Animation
const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function DashboardPage() {
  const [loadingStats, setLoadingStats] = useState(true);
  const [fundSummary, setFundSummary] = useState(null);
  const [nextOnDuty, setNextOnDuty] = useState(null);

  // Lấy dữ liệu cho Dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);
        // Chạy song song 2 request
        const [summaryData, dutyData] = await Promise.all([
          getFundSummary(),
          getRotationData()
        ]);

        // 1. Set số dư
        setFundSummary(summaryData);

        // 2. Set người làm nhiệm vụ
        if (dutyData.members && dutyData.members.length > 0) {
          const { members, currentIndex } = dutyData;

          // Tính toán index của người TIẾP THEO
          const nextIndex = (currentIndex + 1) % members.length;
          const nextPerson = members[nextIndex];

          setNextOnDuty(nextPerson);
        }

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    // Delay 300ms trước khi fetch để tránh giật lag khi chuyển nav nhanh
    const timeoutId = setTimeout(() => {
      fetchDashboardData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <motion.div
      variants={pageAnimation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
        Chào mừng đến với TeamHub
      </h1>
      <p className="mt-2 text-muted-foreground mb-6">
        Tổng quan các hoạt động của team.
      </p>

      {/* --- SỬA LẠI GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cột 1: Thống kê (mới) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Card Số Dư Quỹ */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số dư Quỹ</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-3/4" />
              ) : (
                <div className="text-3xl font-bold">
                  {formatCurrency(fundSummary?.currentBalance)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Nhiệm Vụ */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kỳ tiếp theo</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-1/2" />
              ) : (
                <div className="text-3xl font-bold">
                  {nextOnDuty ? nextOnDuty.name : "Chưa có ai"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cột 2: Sự kiện (cũ) */}
        <div className="lg:col-span-2">
          <UpcomingEvents />
        </div>

      </div>
    </motion.div>
  );
}