// src/pages/UsersPage.jsx
import { UserList } from "@/features/users/UserList.jsx";
import { motion } from "framer-motion";

const pageAnimation = { /* ... */ };

export function UsersPage() {
  return (
    <motion.div variants={pageAnimation} initial="initial" animate="animate">
      <UserList />
    </motion.div>
  );
}