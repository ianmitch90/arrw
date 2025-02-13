'use client';

import React from 'react';
import { Formik, Field, Form } from 'formik';
import { Checkbox } from '@heroui/react';
import * as Yup from 'yup';

interface FormValues {
  notABot: boolean;
}

const validationSchema = Yup.object().shape({
  notABot: Yup.boolean().oneOf(
    [true],
    'You must confirm that you are not a bot'
  )
});

export default function BotChecker({
  onNext
}: {
  onNext: (values: FormValues) => void;
}) {
  const initialValues: FormValues = {
    notABot: false
  };

  const handleSubmit = (values: FormValues) => {
    onNext(values); // Call the onNext function with the values
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, setFieldTouched, values, setValues }) => (
        <Form>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quick Check 🤖</h2>
            <p className="text-sm text-gray-500">
              We just need to make sure you&apos;re human (and hopefully your
              soulmate)!
            </p>
            <Checkbox
              color="primary"
              name="notABot"
              isSelected={values.notABot}
              isInvalid={!!errors.notABot && touched.notABot}
              onChange={(e) => setValues({ notABot: e.target.checked })}
              onBlur={() => setFieldTouched('notABot', true)}
            >
              I confirm I am not a bot
            </Checkbox>
            {touched.notABot && errors.notABot && (
              <div className="text-red-500">{errors.notABot}</div>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}
