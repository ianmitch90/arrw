'use client';

import React from 'react';
import { AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import LoginForm from '@/components/ui/AuthForms/LoginForm';
import SignUpForm from '@/components/ui/AuthForms/SignUpForm';
import { Icon } from '@iconify/react';

export default function AuthFlow() {
  const [isLoginVisible, setIsLoginVisible] = React.useState(true);

  const variants = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 10 }
  };

  return (
    <div className="flex h-full w-full items-center justify-center flex-col">
      <div className="flex flex-col items-center pb-2">
        <Icon icon="mdi:map-marker-outline" />
        <p className="text-xl font-medium">Welcome</p>
        <p className="text-small text-default-500">
          Login or create your account to get started
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <LazyMotion features={domAnimation}>
          <h1 className="mb-4 text-xl font-medium">
            {isLoginVisible ? 'Log In' : 'Sign Up'}
          </h1>
          <AnimatePresence initial={false} mode="popLayout">
            {isLoginVisible ? (
              <LoginForm
                setIsLoginVisible={setIsLoginVisible}
                variants={variants}
              />
            ) : (
              <SignUpForm
                setIsLoginVisible={setIsLoginVisible}
                variants={variants}
              />
            )}
          </AnimatePresence>
        </LazyMotion>
      </div>
    </div>
  );
}
