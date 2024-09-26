'use client';

import React from 'react';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { cn } from '@/utils/cn';

import VerticalSteps from './VerticalSteps';
import RowSteps from './RowSteps';
import MultistepNavigationButtons from './MultistepNavigationButtons';

export type MultiStepSidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  currentPage: number;
  onBack: () => void;
  onNext: () => void;
  onChangePage: (page: number) => void;
  isValid: boolean;
  dirty: boolean;
  isSubmitting: boolean;
};

const stepperClasses = cn(
  '[--step-color:hsl(var(--nextui-secondary-400))]',
  '[--active-color:hsl(var(--nextui-secondary-400))]',
  '[--inactive-border-color:hsl(var(--nextui-secondary-200))]',
  '[--inactive-bar-color:hsl(var(--nextui-secondary-200))]',
  '[--inactive-color:hsl(var(--nextui-secondary-300))]',
  'dark:[--step-color:rgba(255,255,255,0.1)]',
  'dark:[--active-color:hsl(var(--nextui-foreground-600))]',
  'dark:[--active-border-color:rgba(255,255,255,0.5)]',
  'dark:[--inactive-border-color:rgba(255,255,255,0.1)]',
  'dark:[--inactive-bar-color:rgba(255,255,255,0.1)]',
  'dark:[--inactive-color:rgba(255,255,255,0.2)]'
);

const MultiStepSidebar = React.forwardRef<
  HTMLDivElement,
  MultiStepSidebarProps
>(
  (
    {
      children,
      className,
      currentPage,
      onBack,
      onNext,
      onChangePage,
      isValid,
      dirty,
      isSubmitting,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('flex h-[calc(100vh_-_40px)] w-full gap-x-2', className)}
        {...props}
      >
        <div className="flex hidden h-full w-[344px] flex-shrink-0 flex-col items-start gap-y-8 rounded-large bg-gradient-to-tl from-slate-900 from-0% to-stone-900 to-100% px-8 py-6 shadow-small lg:flex">
          <Button
            className="bg-default-50 text-small font-medium text-default-500 shadow-lg"
            isDisabled={currentPage === 0}
            radius="full"
            variant="flat"
            onPress={onBack}
          >
            <Icon icon="solar:arrow-left-outline" width={18} />
            Back
          </Button>
          <div>
            <div className="text-xl font-medium leading-7 text-default-foreground">
              Arrw
            </div>
            <div className="mt-1 text-base font-medium leading-6 text-default-500">
              Find your a perfect match with a few steps.
            </div>
          </div>
          {/* Desktop Steps */}
          <VerticalSteps
            className={stepperClasses}
            color="secondary"
            currentStep={currentPage}
            steps={[
              {
                title: 'Create an account',
                description: 'Setting up your profile'
              },
              {
                title: "Verify you're human",
                description: 'Quick bot check'
              },
              {
                title: 'Verify your email',
                description: 'Confirm your email address'
              },
              {
                title: 'Add a photo',
                description: 'Show your best self'
              }
            ]}
            onStepChange={onChangePage}
          />
        </div>
        <div className="flex h-full w-full flex-col items-center gap-4 md:p-4">
          <div className="sticky top-0 z-10 w-full rounded-large bg-gradient-to-tl from-slate-900 from-0% to-stone-900 to-100% py-4 shadow-small md:max-w-xl lg:hidden">
            <div className="flex justify-center">
              {/* Mobile Steps */}
              <RowSteps
                className={cn('pl-6', stepperClasses)}
                currentStep={currentPage}
                steps={[
                  { title: 'Account' },
                  { title: 'Verify' },
                  { title: 'Email' },
                  { title: 'Photo' }
                ]}
                onStepChange={onChangePage}
              />
            </div>
          </div>
          <div className="h-full w-full p-4 sm:max-w-md md:max-w-lg">
            {children}
            <MultistepNavigationButtons
              backButtonProps={{ isDisabled: currentPage === 0 }}
              className="lg:hidden"
              nextButtonProps={{
                children:
                  currentPage === 0
                    ? "Let's Get Started!"
                    : currentPage === 3
                      ? 'Complete Sign Up'
                      : 'Continue',
                isDisabled: !isValid || !dirty || isSubmitting // Disable button if form is invalid, untouched, or submitting
              }}
              onBack={onBack}
              onNext={onNext}
            />
          </div>
        </div>
      </div>
    );
  }
);

MultiStepSidebar.displayName = 'MultiStepSidebar';

export default MultiStepSidebar;
