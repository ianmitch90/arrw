'use client';

import React from 'react';
import { domAnimation, LazyMotion, m } from 'framer-motion';
import { Formik, Form, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import SignUpForm from './SignUpForm';
import BotChecker from './BotChecker';
import EmailVerification from './EmailVerification';
import PhotoUpload from './PhotoUpload';
import MultistepSidebar from './MultistepSidebar';
import MultistepNavigationButtons from './MultistepNavigationButtons';

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

const validationSchema = [
  Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(/[a-zA-Z]/, 'Password must contain at least one letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm Password is required'),
    terms: Yup.boolean().oneOf(
      [true],
      'You must accept the terms and conditions'
    )
  }),
  Yup.object().shape({
    notABot: Yup.boolean().oneOf([true], 'Please confirm you are not a bot')
  }),
  Yup.object().shape({
    verificationCode: Yup.string()
      .matches(/^[0-9]+$/, 'Must be only digits')
      .min(6, 'Must be exactly 6 digits')
      .max(6, 'Must be exactly 6 digits')
      .required('Verification code is required')
  }),
  Yup.object().shape({
    photo: Yup.mixed()
      .nullable()
      .test('fileSize', 'File too large', (value) => {
        if (!value) return true; // Allows empty value
        if (value instanceof File) {
          return value.size <= 5000000; // 5MB
        }
        return false;
      })
  })
];

const initialValues = {
  email: '',
  password: '',
  confirmPassword: '',
  terms: false,
  notABot: false,
  verificationCode: '',
  photo: null as File | null
};

export default function MultiStepSignUp() {
  const [[page, direction], setPage] = React.useState([0, 0]);

  const paginate = React.useCallback((newDirection: number) => {
    setPage((prev) => {
      const nextPage = prev[0] + newDirection;
      if (nextPage < 0 || nextPage > 3) return prev;
      return [nextPage, newDirection];
    });
  }, []);

  const onChangePage = React.useCallback((newPage: number) => {
    setPage((prev) => {
      if (newPage < 0 || newPage > 3) return prev;
      const currentPage = prev[0];
      return [newPage, newPage > currentPage ? 1 : -1];
    });
  }, []);

  const onBack = React.useCallback(() => {
    paginate(-1);
  }, [paginate]);

  const onNext = React.useCallback(() => {
    paginate(1);
  }, [paginate]);

  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: FormikHelpers<typeof initialValues>
  ) => {
    // Handle final form submission
    console.log(values);
    setSubmitting(false);
  };

  const content = React.useMemo(() => {
    let component = <SignUpForm />;

    switch (page) {
      case 1:
        component = <BotChecker />;
        break;
      case 2:
        component = <EmailVerification />;
        break;
      case 3:
        component = <PhotoUpload />;
        break;
    }

    return (
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
          {component}
        </m.div>
      </LazyMotion>
    );
  }, [direction, page]);

  return (
    <div className="relative flex h-fit w-full flex-col pt-6 text-center lg:h-full lg:justify-center lg:pt-0">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema[page]}
        onSubmit={handleSubmit}
        validateOnMount={true} // Validate on mount
      >
        {({ isSubmitting, validateForm, isValid, dirty }) => (
          <Form>
            <MultistepSidebar
              currentPage={page}
              onBack={onBack}
              onChangePage={onChangePage}
              onNext={async () => {
                const errors = await validateForm();
                if (Object.keys(errors).length === 0) {
                  onNext();
                }
              }}
              isValid={isValid}
              dirty={dirty}
              isSubmitting={isSubmitting}
            >
              {content}
              <MultistepNavigationButtons
                backButtonProps={{ isDisabled: page === 0 }}
                className="hidden justify-start lg:flex"
                nextButtonProps={{
                  children:
                    page === 0
                      ? "Let's Get Started!"
                      : page === 3
                        ? 'Complete Sign Up'
                        : 'Continue',
                  isDisabled: !isValid || !dirty || isSubmitting // Disable button if form is invalid, untouched, or submitting
                }}
                onBack={onBack}
                onNext={async () => {
                  const errors = await validateForm();
                  if (Object.keys(errors).length === 0) {
                    onNext();
                  }
                }}
              />
            </MultistepSidebar>
          </Form>
        )}
      </Formik>
    </div>
  );
}
