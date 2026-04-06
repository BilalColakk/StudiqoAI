import { motion, AnimatePresence } from 'framer-motion';

const variants = {
  initial:  { opacity: 0, y: 18 },
  animate:  { opacity: 1, y: 0 },
  exit:     { opacity: 0, y: -18 },
};

export default function PageTransition({ children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
