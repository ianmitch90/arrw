'use client';

import { useState } from 'react';
import { DatePicker } from '@heroui/react';
import Button from '@/components/ui/Button';
import { today, getLocalTimeZone, CalendarDate } from '@internationalized/date';

interface AgeVerificationFormProps {
  onSubmit: (birthDate: CalendarDate) => void;
  loading?: boolean;
}

export default function AgeVerificationForm({ onSubmit, loading }: AgeVerificationFormProps) {
  const [birthDate, setBirthDate] = useState<CalendarDate | null>(null);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAge = (date: CalendarDate | null): boolean => {
    if (!date) return false;

    const todayDate = today(getLocalTimeZone());
    let age = todayDate.year - date.year;
    
    if (
      todayDate.month < date.month || 
      (todayDate.month === date.month && todayDate.day < date.day)
    ) {
      age--;
    }
    
    return age >= 18;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!birthDate) {
      setError('Please select a birth date');
      return;
    }

    if (!validateAge(birthDate)) {
      setError('You must be at least 18 years old');
      return;
    }

    onSubmit(birthDate);
  };

  const handleDateChange = (date: CalendarDate | null) => {
    setBirthDate(date);
    setTouched(true);
    
    if (!date) {
      setError('Please select a birth date');
    } else if (!validateAge(date)) {
      setError('You must be at least 18 years old');
    } else {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DatePicker
        label="Birth Date"
        value={birthDate}
        onChange={handleDateChange}
        onBlur={() => setTouched(true)}
        isInvalid={touched && !!error}
        errorMessage={touched && error}
        maxValue={today(getLocalTimeZone())}
        isRequired
        showMonthAndYearPickers
        variant="bordered"
        validationBehavior="native"
        classNames={{
          base: "w-full",
          input: "w-full",
        }}
      />

      <Button
        type="submit"
        className="mt-2 w-full"
        loading={loading}
        disabled={!birthDate || !!error || loading}
      >
        Verify Age
      </Button>
    </form>
  );
}
