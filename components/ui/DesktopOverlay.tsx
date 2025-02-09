import { useSearchParams, useRouter } from 'next/navigation';
import { OverlayContent } from './OverlayContent';
import { motion, AnimatePresence } from 'framer-motion';

export function DesktopOverlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const drawerParam = searchParams?.get('drawer') ?? null;
  const isOpen = !!drawerParam;

  const handleClose = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('drawer');
    const newQuery = params.toString();
    router.push(`/map${newQuery ? `?${newQuery}` : ''}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={handleClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-8 z-50 overflow-hidden rounded-lg bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-lg font-semibold">
                  {selectedId ? "Chat" : "Messages"}
                </h2>
                <button
                  onClick={closeOverlay}
                  className="rounded-full p-2 hover:bg-gray-100"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <OverlayContent />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
