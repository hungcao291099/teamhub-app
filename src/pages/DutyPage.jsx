import { DutyRotation } from "@/features/duty/DutyRotation";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};
export function DutyPage() {
  const navigate = useNavigate();
  return (
    <motion.div
      variants={pageAnimation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/utilities")}>
        <ChevronLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>
      <DutyRotation />
    </motion.div>
  );
}