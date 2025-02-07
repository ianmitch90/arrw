'use client';

import { ButtonProps } from '@nextui-org/react';
import { Button } from '@nextui-org/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface ButtonWithBorderGradientProps extends Omit<ButtonProps, 'as' | 'css'> {
  href?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDeg?: number;
  glowOnHover?: boolean;
  pulseOnHover?: boolean;
  borderWidth?: number;
  isExternal?: boolean;
}

export function ButtonWithBorderGradient({
  children,
  href,
  className,
  gradientFrom = '#F871A0',
  gradientTo = '#9353D3',
  gradientDeg = 90,
  glowOnHover = true,
  pulseOnHover = false,
  borderWidth = 2,
  isExternal = false,
  isDisabled,
  ...props
}: ButtonWithBorderGradientProps) {
  const buttonContent = (
    <motion.div
      className="relative w-full"
      whileHover={pulseOnHover ? { scale: 1.02 } : undefined}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          glowOnHover && 'hover:shadow-[0_0_2rem_-0.5rem_var(--gradient-from)]',
          className
        )}
        style={{
          '--gradient-from': gradientFrom,
          '--gradient-to': gradientTo,
          '--gradient-deg': `${gradientDeg}deg`,
          border: `solid ${borderWidth}px transparent`,
          backgroundImage: `linear-gradient(to bottom, hsl(var(--nextui-background)) 0 100%), linear-gradient(var(--gradient-deg), var(--gradient-from), var(--gradient-to))`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          position: 'relative',
          zIndex: 1
        } as React.CSSProperties}
        isDisabled={isDisabled}
        {...props}
      >
        {/* Gradient overlay for hover effect */}
        <div
          className={cn(
            'absolute inset-[2px] rounded-[inherit] opacity-0 transition-opacity duration-300',
            'bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)]',
            !isDisabled && 'group-hover:opacity-[0.1]'
          )}
        />
        
        {/* Button content */}
        <div className="relative z-10">{children}</div>
      </Button>

      {/* Glow effect */}
      {glowOnHover && !isDisabled && (
        <div
          className="absolute -inset-[1px] rounded-[inherit] opacity-0 transition-opacity duration-300 blur-lg group-hover:opacity-25"
          style={{
            background: `linear-gradient(var(--gradient-deg), var(--gradient-from), var(--gradient-to))`
          }}
        />
      )}
    </motion.div>
  );

  if (href) {
    const linkProps = {
      href,
      ...(isExternal && {
        target: '_blank',
        rel: 'noopener noreferrer'
      })
    };

    return (
      <Link
        className={cn(
          'group inline-flex',
          isDisabled && 'pointer-events-none opacity-50'
        )}
        {...linkProps}
      >
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
}
