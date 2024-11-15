'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Icon } from '@iconify/react';
import { Card as NextCard, CardBody, CardHeader, CardFooter, Divider } from '@nextui-org/react';

interface CardProps {
  title?: string | ReactNode;
  description?: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  icon?: string;
  isHoverable?: boolean;
  isPressable?: boolean;
  isDisabled?: boolean;
  isFooterBlurred?: boolean;
  disableAnimation?: boolean;
  radius?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
  exit: { opacity: 0, y: -20 }
};

export default function Card({
  title,
  description,
  footer,
  children,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  icon,
  isHoverable = false,
  isPressable = false,
  isDisabled = false,
  isFooterBlurred = false,
  disableAnimation = false,
  radius = 'lg',
  shadow = 'md',
  onPress
}: CardProps) {
  const content = (
    <NextCard
      className={cn(
        'border-default-200/50 bg-background/60 backdrop-blur-lg backdrop-saturate-150',
        className
      )}
      isHoverable={isHoverable}
      isPressable={isPressable}
      isDisabled={isDisabled}
      radius={radius}
      shadow={shadow}
      onPress={onPress}
    >
      {(title || description) && (
        <CardHeader className={cn('flex gap-3', headerClassName)}>
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon icon={icon} className="text-xl text-primary" />
            </div>
          )}
          <div className="flex flex-col flex-grow">
            {title && (
              <h3 className={cn(
                'text-lg font-medium',
                typeof title === 'string' ? 'line-clamp-1' : ''
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-default-500 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </CardHeader>
      )}
      
      {children && (
        <CardBody className={cn('gap-4', bodyClassName)}>
          {children}
        </CardBody>
      )}

      {footer && (
        <>
          <Divider />
          <CardFooter
            className={cn(
              isFooterBlurred && 'border-t-1 border-default-200/50 bg-background/60 backdrop-blur-lg backdrop-saturate-150',
              footerClassName
            )}
          >
            {footer}
          </CardFooter>
        </>
      )}
    </NextCard>
  );

  if (disableAnimation) {
    return content;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={isHoverable ? "hover" : undefined}
        whileTap={isPressable ? "tap" : undefined}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
