'use client';

import React, { useState } from 'react';
import { Formik, Field, Form } from 'formik';
import { Button } from '@heroui/react';
import * as Yup from 'yup';

interface FormValues {
  photo: File | null;
}

const validationSchema = Yup.object().shape({
  photo: Yup.mixed().required('A file is required')
});

export default function PhotoUpload({
  onNext
}: {
  onNext: (values: FormValues) => void;
}) {
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const initialValues: FormValues = {
    photo: null
  };

  const handleSubmit = (values: FormValues) => {
    onNext(values); // Call onNext with the values
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ setFieldValue, errors }) => (
        <Form>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Show Your Best Self 📸</h2>
            <p className="text-sm text-gray-500">
              You&apos;re almost done! 🎉 Want to add a photo now or later?
            </p>
            <Field name="photo">
              {({ field, form }: {
                field: { name: string; value: File | null };
                form: { setFieldValue: (field: string, value: File) => void };
              }) => (
                <div className="pt-6 pb-3">
                  <label
                    htmlFor="photo"
                    className="block text-sm font-medium text-gray-500 mt-6 mb-4"
                  >
                    Upload Photo
                  </label>
                  <input
                    id="photo"
                    name="photo"
                    type="file"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) {
                        setFieldValue('photo', file);
                        setPhotoUploaded(true);
                      }
                    }}
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-500
                               file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-violet-50 file:text-violet-700
                               hover:file:bg-violet-100"
                  />
                  <errormessage name="photo">
                    {(msg) => <div className="text-red-500">{msg}</div>}
                  </errormessage>
                </div>
              )}
            </Field>
            <Button
              fullWidth
              className="mt-12 mb-12"
              color="primary"
              isDisabled={!photoUploaded}
              type="submit" // Submit the form when clicked
            >
              Upload
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
