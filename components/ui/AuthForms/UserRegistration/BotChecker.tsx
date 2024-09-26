'use client';

import React, { useEffect } from 'react';
import { Field, useFormikContext, FormikErrors, FormikTouched } from 'formik';
import { Checkbox } from '@nextui-org/react';

interface FormValues {
  notABot: boolean;
}

export default function BotChecker() {
  const { errors, touched, validateForm } = useFormikContext<FormValues>();

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Quick Check 🤖</h2>
      <p className="text-sm text-gray-500">
        We just need to make sure you're human (and hopefully your soulmate)!
      </p>
      <Field name="notABot">
        {({ field, meta }: { field: any; meta: any }) => (
          <Checkbox
            {...field}
            color="primary"
            isInvalid={meta.touched && Boolean(meta.error)}
            errorMessage={meta.touched && meta.error}
          >
            I confirm I am not a bot
          </Checkbox>
        )}
      </Field>
      {errors.notABot && touched.notABot && (
        <div className="text-red-500">{errors.notABot}</div>
      )}
    </div>
  );
}
