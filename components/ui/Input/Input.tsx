'use client';

import React, { ReactNode } from 'react';
import { Input as NextInput, InputProps as NextInputProps } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

export interface InputProps extends Partial<NextInputProps> {
  icon?: string;
  endContent?: ReactNode;
  helperText?: string;
  errorMessage?: string;
  isLoading?: boolean;
  showSuccessIcon?: boolean;
  onClear?: () => void;
}

const errorAnimation = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  }
};

export default function Input({
  icon,
  endContent,
  helperText,
  errorMessage,
  isLoading,
  showSuccessIcon,
  onClear,
  className,
  classNames,
  isInvalid,
  isDisabled,
  value,
  onChange,
  ...props
}: InputProps) {
  const hasValue = value !== undefined && value !== '';
  const showEndContent = endContent || (hasValue && onClear) || showSuccessIcon || isLoading;

  return (
    <motion.div
      variants={errorAnimation}
      animate={errorMessage ? 'shake' : 'initial'}
      className="w-full"
    >
      <NextInput
        value={value}
        onChange={onChange}
        className={cn(
          'max-w-full',
          className
        )}
        classNames={{
          base: cn(
            'bg-background/60 backdrop-blur-lg backdrop-saturate-150',
            classNames?.base
          ),
          mainWrapper: cn(
            'h-full',
            classNames?.mainWrapper
          ),
          input: cn(
            'text-sm',
            classNames?.input
          ),
          inputWrapper: cn(
            'h-full shadow-sm',
            isInvalid ? 'border-danger' : 'border-default-200/50 hover:border-default-400',
            'group-data-[focused=true]:border-primary',
            classNames?.inputWrapper
          ),
          ...classNames
        }}
        startContent={
          icon && (
            <Icon
              icon={icon}
              className={cn(
                'text-xl text-default-400',
                isInvalid && 'text-danger',
                'group-data-[focused=true]:text-primary'
              )}
            />
          )
        }
        endContent={
          showEndContent && (
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="w-4 h-4">
                  <Icon
                    icon="eos-icons:loading"
                    className="text-default-400 animate-spin"
                  />
                </div>
              )}
              {showSuccessIcon && hasValue && !isLoading && !isInvalid && (
                <Icon
                  icon="solar:check-circle-bold"
                  className="text-xl text-success"
                />
              )}
              {hasValue && onClear && !isDisabled && !isLoading && (
                <button
                  type="button"
                  onClick={onClear}
                  className="p-1 rounded-full hover:bg-default-100 active:bg-default-200 transition-colors"
                >
                  <Icon
                    icon="solar:close-circle-bold"
                    className="text-xl text-default-400"
                  />
                </button>
              )}
              {endContent}
            </div>
          )
        }
        errorMessage={errorMessage}
        description={helperText}
        isInvalid={isInvalid}
        isDisabled={isDisabled}
        {...props}
      />
    </motion.div>
  );
}
