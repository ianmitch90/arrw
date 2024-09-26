'use client';

import React, { useEffect, useRef, useState } from 'react';
import useMeasure from 'react-use-measure';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { cn } from '../../utils/cn';
import useClickOutside from '../../utils/hooks/useClickOutside';
import { Folder, MessageCircle, User, WalletCards } from 'lucide-react';
import { Button } from '@nextui-org/react';

const transition = {
  type: 'spring',
  bounce: 0.1,
  duration: 0.25
};

const ITEMS = [
  {
    id: 1,
    label: 'User',
    title: <User className="h-5 w-5 text-default-500" />,
    content: (
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-1 text-default-500">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400" />
          <span>Ibelick</span>
        </div>
        <Button
          isIconOnly
          className="relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg border border-default-200 px-2 text-sm text-default-500 transition-colors hover:bg-default-100 hover:text-default-800 focus-visible:ring-2 active:scale-[0.98]"
          type="button"
        >
          Edit Profile
        </Button>
      </div>
    )
  },
  {
    id: 2,
    label: 'Messages',
    title: <MessageCircle className="h-5 w-5 text-default-500" />,
    content: (
      <div className="flex flex-col space-y-4">
        <div className="text-default-500">You have 3 new messages.</div>
        <Button
          isIconOnly
          className="relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg border border-default-200 px-2 text-sm text-default-500 transition-colors hover:bg-default-100 hover:text-default-800 focus-visible:ring-2 active:scale-[0.98]"
          type="button"
        >
          View more
        </Button>
      </div>
    )
  },
  {
    id: 3,
    label: 'Documents',
    title: <Folder className="h-5 w-5 text-default-500" />,
    content: (
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col text-default-500">
          <div className="space-y-1">
            <div>Project_Proposal.pdf</div>
            <div>Meeting_Notes.docx</div>
            <div>Financial_Report.xls</div>
          </div>
        </div>
        <Button
          isIconOnly
          className="relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg border border-default-200 px-2 text-sm text-default-500 transition-colors hover:bg-default-100 hover:text-default-800 focus-visible:ring-2 active:scale-[0.98]"
          type="button"
        >
          Manage documents
        </Button>
      </div>
    )
  },
  {
    id: 4,
    label: 'Wallet',
    title: <WalletCards className="h-5 w-5 text-default-500" />,
    content: (
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col text-default-500">
          <span>Current Balance</span>
          <span>$1,250.32</span>
        </div>
        <Button
          isIconOnly
          className="relative h-8 w-full scale-100 select-none appearance-none items-center justify-center rounded-lg border border-default-200 px-2 text-sm text-default-500 transition-colors hover:bg-default-100 hover:text-default-800 focus-visible:ring-2 active:scale-[0.98]"
          type="button"
        >
          View Transactions
        </Button>
      </div>
    )
  }
];

export default function BottomNav() {
  const [active, setActive] = useState<number | null>(null);
  const [contentRef, { height: heightContent }] = useMeasure();
  const [menuRef, { width: widthContainer }] = useMeasure();
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState(0);

  useClickOutside(ref, () => {
    setIsOpen(false);
    setActive(null);
  });

  useEffect(() => {
    if (!widthContainer || maxWidth > 0) return;

    setMaxWidth(widthContainer);
  }, [widthContainer, maxWidth]);

  return (
    <MotionConfig transition={transition}>
      <div
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl"
        ref={ref}
      >
        <div className="h-full w-full rounded-xl border border-default-200/20 bg-background/60 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50">
          <div className="overflow-hidden">
            <AnimatePresence initial={false} mode="sync">
              {isOpen ? (
                <motion.div
                  key="content"
                  initial={{ height: 0 }}
                  animate={{ height: heightContent || 0 }}
                  exit={{ height: 0 }}
                  style={{
                    width: maxWidth
                  }}
                >
                  <div ref={contentRef} className="p-2">
                    {ITEMS.map((item) => {
                      const isSelected = active === item.id;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isSelected ? 1 : 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <div
                            className={cn(
                              'px-2 pt-2 text-sm',
                              isSelected ? 'block' : 'hidden'
                            )}
                          >
                            {item.content}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <div
            className="flex justify-between space-x-2 p-2 px-12"
            ref={menuRef}
          >
            {ITEMS.map((item) => (
              <button
                key={item.id}
                aria-label={item.label}
                className={cn(
                  'relative flex h-9 w-9 shrink-0 scale-100 select-none appearance-none items-center justify-center rounded-lg text-default-500 transition-colors hover:bg-default-100 hover:text-default-800 focus-visible:ring-2 active:scale-[0.98]',
                  active === item.id ? 'bg-default-100 text-default-800' : ''
                )}
                type="button"
                onClick={() => {
                  if (!isOpen) setIsOpen(true);
                  if (active === item.id) {
                    setIsOpen(false);
                    setActive(null);
                    return;
                  }

                  setActive(item.id);
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
