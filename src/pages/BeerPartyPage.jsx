// src/pages/BeerPartyPage.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { streamParty, updateCount, endBeerParty } from "@/services/beerPartyService";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Plus, Minus, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Animation
const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};


export function BeerPartyPage() {
  const { partyId } = useParams(); // Lấy ID từ URL
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false); 
  const navigate = useNavigate();
  const handleEndParty = async () => {
    setIsEnding(true);
    try {
      await endBeerParty(partyId);
      navigate('/utilities'); // Quay về trang danh sách tiện ích
    } catch (error) {
      console.error("Lỗi khi kết thúc tiệc:", error);
      setIsEnding(false);
    }
  };
  // "Lắng nghe" dữ liệu real-time
  useEffect(() => {
    // Gọi hàm stream và lưu lại hàm "hủy" (unsubscribe)
    const unsubscribe = streamParty(partyId, (partyData) => {
      setParty(partyData);
      setLoading(false);
    });

    // Hàm dọn dẹp: Hủy "lắng nghe" khi thoát trang
    return () => unsubscribe(); 
  }, [partyId]);

  // Tự động sắp xếp lại danh sách khi "party" thay đổi
  const sortedParticipants = useMemo(() => {
    if (!party?.participants) return [];
    // Sao chép và sắp xếp: Giảm dần
    return [...party.participants].sort((a, b) => b.count - a.count);
  }, [party]);

  // Hàm xử lý khi nhấn + hoặc -
  const handleCountChange = async (memberId, currentCount, change) => {
    try {
      await updateCount(partyId, memberId, currentCount + change);
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!party) return <div>Không tìm thấy bữa tiệc!</div>;

  return (
    <motion.div variants={pageAnimation} initial="initial" animate="animate">
      <div className="flex justify-between items-center mb-4">
        <Button asChild variant="outline">
          <Link to="/utilities">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Link>
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleEndParty}
          disabled={isEnding}
        >
          {isEnding ? "Đang lưu..." : "Kết thúc tiệc"}
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Tổng cộng:</h2>
          <span className="text-3xl font-bold text-primary">{party.totalCount} lon</span>
        </CardContent>
      </Card>
      
      <h2 className="text-2xl font-bold mb-4">Bảng xếp hạng:</h2>
      
      <div className="space-y-4">
        {sortedParticipants.map((p, index) => (
          <BeerCounterCard
            key={p.memberId}
            participant={p}
            isKing={index === 0 && p.count > 0} // Vua bia!
            onIncrement={() => handleCountChange(p.memberId, p.count, 1)}
            onDecrement={() => handleCountChange(p.memberId, p.count, -1)}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Card đếm số
function BeerCounterCard({ participant, isKing, onIncrement, onDecrement }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClick = async (action) => {
    setIsUpdating(true); // Vô hiệu hóa nút
    try {
      await action(); 
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
    } finally {
      setIsUpdating(false); 
    }
  };

  return (
    <Card className={`transition-all ${isKing ? "border-primary shadow-lg" : ""}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={participant.avatar} />
            <AvatarFallback>{participant.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-lg flex items-center gap-2">
              {participant.name}
              {isKing && <Crown className="h-5 w-5 text-yellow-500" />}
            </p>
            <span className="text-3xl font-bold">{participant.count}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleClick(onDecrement)}
            disabled={isUpdating || participant.count === 0}
          >
            <Minus className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            onClick={() => handleClick(onIncrement)}
            disabled={isUpdating}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton
function LoadingSkeleton() {
  return (
    <div>
      <Skeleton className="h-10 w-48 mb-4" />
      <Skeleton className="h-24 w-full mb-6" />
      <Skeleton className="h-8 w-40 mb-4" />
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}