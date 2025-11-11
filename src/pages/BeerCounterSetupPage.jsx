// src/pages/BeerCounterSetupPage.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { getUsers } from "@/services/userService"; // Dùng lại service cũ
import { createBeerParty } from "@/services/beerPartyService"; // Service mới
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Animation
const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function BeerCounterSetupPage() {
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]); // Lưu full object
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  // Tải danh sách thành viên khi vào trang
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const members = await getUsers();
        setAllMembers(members);
      } catch (error) {
        console.error("Lỗi tải thành viên:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMembers();
  }, []);

  // Xử lý khi tick chọn/bỏ chọn
  const handleCheckChange = (member) => {
    setSelectedMembers((prev) => {
      const isSelected = prev.some((m) => m.id === member.id);
      if (isSelected) {
        return prev.filter((m) => m.id !== member.id); // Bỏ chọn
      } else {
        return [...prev, member]; // Thêm chọn
      }
    });
  };

  // Xử lý khi nhấn "Bắt đầu"
  const handleSubmit = async () => {
    if (selectedMembers.length === 0) return;
    setIsCreating(true);
    try {
      const newPartyId = await createBeerParty(selectedMembers);
      // Chuyển hướng đến trang đếm (sẽ tạo ở bước sau)
      navigate(`/utilities/beer-party/${newPartyId}`);
    } catch (error) {
      console.error("Lỗi:", error);
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      variants={pageAnimation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      <Button asChild variant="outline" className="mb-4">
        <Link to="/utilities">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-2">Tạo Bữa Tiệc Mới</h1>
      <p className="text-muted-foreground mb-6">Chọn những ai tham gia:</p>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allMembers.map((member) => (
            <MemberCheckCard
              key={member.id}
              member={member}
              isChecked={selectedMembers.some((m) => m.id === member.id)}
              onCheckChange={() => handleCheckChange(member)}
            />
          ))}
        </div>
      )}

      {/* Nút Bắt đầu (nổi) */}
      {selectedMembers.length > 0 && (
        <Card className="fixed bottom-24 left-1/2 -translate-x-1/2 w-11/12 md:w-auto shadow-lg z-10">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="font-bold">Đã chọn {selectedMembers.length} người</p>
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? "Đang tạo..." : "Bắt đầu!"}
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// Component Card con để chọn
function MemberCheckCard({ member, isChecked, onCheckChange }) {
  return (
    <label
      htmlFor={member.id}
      className={`p-4 rounded-lg border flex items-center gap-4 cursor-pointer
      ${isChecked ? "border-primary bg-primary/10" : "hover:bg-accent"}`}
    >
      <Checkbox
        id={member.id}
        checked={isChecked}
        onCheckedChange={onCheckChange}
      />
      <Avatar>
        <AvatarImage src={member.avatar} />
        <AvatarFallback>{member.name?.[0]}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{member.name}</span>
    </label>
  );
}

// Skeleton
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-lg border flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
      ))}
    </div>
  );
}