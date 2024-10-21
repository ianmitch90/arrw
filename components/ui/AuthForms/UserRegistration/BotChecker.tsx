'use client';

import React from 'react';
import { Formik, Field, Form, errormessage } from 'formik';
import { Checkbox } from '@nextui-org/react';
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
      {({ errors, touched }) => (
        <Form>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quick Check 🤖</h2>
            <p className="text-sm text-gray-500">
              We just need to make sure you're human (and hopefully your
              soulmate)!
            </p>
            <Field name="notABot">
              {({ field, meta }: { field: any; meta: any }) => (
                <Checkbox
                  {...field}
                  color="primary"
                  isInvalid={meta.touched && Boolean(meta.error)}
                >
                  I confirm I am not a bot
                </Checkbox>
              )}
            </Field>
            <errormessage name="notABot">
              {(msg) => <div className="text-red-500">{msg}</div>}
            </errormessage>
          </div>
        </Form>
      )}
    </Formik>
  );
}
