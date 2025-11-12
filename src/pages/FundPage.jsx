import { FundLedger } from "@/features/fund/FundLedger";
import { motion } from "framer-motion";
const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function FundPage() {
  return (
  <motion.div
        variants={pageAnimation}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
          <FundLedger />;
      </motion.div>
  )
}