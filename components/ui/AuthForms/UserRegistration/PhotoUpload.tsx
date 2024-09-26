'use client';

import React, { useState, useEffect } from 'react';
import { Field, useFormikContext, FormikErrors, FormikTouched } from 'formik';
import { Button } from '@nextui-org/react';

interface FormValues {
  photo: File | null;
}

export default function PhotoUpload() {
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const { errors, touched, isSubmitting, validateForm } =
    useFormikContext<FormValues>();

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Show Your Best Self 📸</h2>
      <p className="text-sm text-gray-500">
        You're almost done! 🎉 Want to add a photo now or later?
      </p>
      <Field name="photo">
        {({ field, form }: { field: any; form: any }) => (
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
                  form.setFieldValue('photo', file);
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
            {errors.photo && touched.photo && (
              <div className="text-red-500">{errors.photo as string}</div>
            )}
          </div>
        )}
      </Field>
      <Button
        fullWidth
        type="submit"
        color="primary"
        isDisabled={!photoUploaded}
        isLoading={isSubmitting}
        className="mt-12 mb-12"
      >
        Upload
      </Button>
    </div>
  );
}
