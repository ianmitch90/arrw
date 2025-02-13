'use client';

import React from 'react';
import { domAnimation, LazyMotion, m } from 'framer-motion';
import SignUpForm from './SignUpForm';
import BotChecker from './BotChecker';
import EmailVerification from './EmailVerification';
import PhotoUpload from './PhotoUpload';
import MultistepSidebar from './MultistepSidebar';
import MultistepNavigationButtons from './MultistepNavigationButtons';
import { Spinner } from '@heroui/react';
import { FormProvider, useFormContext } from './FormContext';

const variants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 30 : -30,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    y: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    y: direction < 0 ? 30 : -30,
    opacity: 0
  })
};

export default function MultiStepSignUp() {
  const [[page, direction], setPage] = React.useState([0, 0]);
  const [formValues, setFormValues] = React.useState({}); // Store form values

  const paginate = React.useCallback((newDirection: number) => {
    setPage((prev) => {
      const nextPage = prev[0] + newDirection;
      if (nextPage < 0 || nextPage > 3) return prev;
      return [nextPage, newDirection];
    });
  }, []);

  const handleNext = React.useCallback(
    (values: any) => {
      setFormValues((prevValues) => ({ ...prevValues, ...values }));
      paginate(1);
    },
    [paginate]
  );

  const content = React.useMemo(() => {
    switch (page) {
      case 0:
        return <SignUpForm onNext={handleNext} />;
      case 1:
        return <BotChecker onNext={handleNext} />;
      case 2:
        return <EmailVerification onNext={handleNext} />;
      case 3:
        return <PhotoUpload onNext={handleNext} />;
      default:
        return <Spinner />;
    }
  }, [page, handleNext]);

  return (
    <FormProvider
      value={{
        values: formValues,
        errors: {},
        touched: {},
        validateForm: async () => {},
        handleSubmit: () => {},
        setValues: setFormValues
      }}
    >
      <div className="relative flex h-fit w-full flex-col pt-6 text-center lg:h-full lg:justify-center lg:pt-0">
        <MultistepSidebar
          currentPage={page}
          onBack={() => paginate(-1)}
          onChangePage={(newPage) =>
            setPage([newPage, newPage > page ? 1 : -1])
          }
          onNext={() => handleNext({})}
          isValid={true}
          dirty={false}
          isSubmitting={false}
        >
          <LazyMotion features={domAnimation}>
            <m.div
              key={page}
              animate="center"
              className="col-span-12"
              custom={direction}
              exit="exit"
              initial="exit"
              transition={{
                y: { ease: 'backOut', duration: 0.35 },
                opacity: { duration: 0.4 }
              }}
              variants={variants}
            >
              {content}
            </m.div>
          </LazyMotion>
          <MultistepNavigationButtons
            backButtonProps={{ isDisabled: page === 0 }}
            className="hidden justify-start lg:flex"
            nextButtonProps={{
              children: page === 3 ? 'Complete Sign Up' : 'Continue',
              isDisabled: false
            }}
            onBack={() => paginate(-1)}
            onNext={() => handleNext({})}
          />
        </MultistepSidebar>
      </div>
    </FormProvider>
  );
}
