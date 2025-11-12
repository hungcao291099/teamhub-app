// src/pages/UsersPage.jsx
import { UserList } from "@/features/users/UserList.jsx";
import { motion } from "framer-motion";

const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};


export function UsersPage() {
  return (
    <motion.div variants={pageAnimation} initial="initial" animate="animate">
      <UserList />
    </motion.div>
  );
}