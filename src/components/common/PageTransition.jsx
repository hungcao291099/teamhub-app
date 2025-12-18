import { motion } from "framer-motion";

export function PageTransition({ children, className = "" }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
                duration: 0.25,
                ease: [0.25, 1, 0.5, 1] // Cubic bezier for "smooth" feel
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
