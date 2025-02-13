"use client";

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Checkbox,
  Divider,
  Spacer
} from "@heroui/react";
import { DatePicker } from '@/components/ui/date-picker';
import { useAgeVerification } from '@/contexts/AgeVerificationContext';
import { useToast } from '@/components/ui/toast';
import { m } from 'framer-motion';

interface AgeVerificationData {
  birthDate: Date;
  method: 'modal';
  isAnonymous: boolean;
  hasAcknowledged: boolean;
}

export function AgeVerificationCard() {
  const { verifyAge, isLoading, error, isSignupFlow } = useAgeVerification();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const handleVerification = async () => {
    if (!selectedDate || !hasAcknowledged) {
      toast({
        type: 'error',
        title: 'Required Fields',
        description: 'Please acknowledge the terms and provide your birth date.'
      });
      return;
    }

    try {
      await verifyAge({
        birthDate: selectedDate,
        method: 'modal',
        isAnonymous: false,
        hasAcknowledged
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Verification Failed',
        description: error?.message || 'Please try again later.'
      });
    }
  };

  return (
    <Card 
      className="w-full max-w-[500px] mx-auto"
      as={m.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardHeader className="px-6 pb-0 pt-6">
        <div className="flex flex-col items-start">
          <h4 className="text-xl font-bold">Age Verification</h4>
          <p className="text-small text-default-500">
            Please verify your age to continue using our service.
          </p>
        </div>
      </CardHeader>

      <Spacer y={2} />

      <CardBody className="px-6 gap-6">
        <div className="bg-default-50 rounded-lg p-4">
          <p className="text-small text-default-700 mb-3">
            By continuing, you acknowledge that you are of legal age in your jurisdiction 
            to access this content. False acknowledgment may result in legal consequences.
          </p>
          <Checkbox
            isSelected={hasAcknowledged}
            onValueChange={setHasAcknowledged}
            size="sm"
            classNames={{
              label: "text-small"
            }}
          >
            I acknowledge that I am of legal age
          </Checkbox>
        </div>

        <DatePicker
          label="Birth Date"
          placeholder="Select your birth date"
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          maxDate={new Date()}
          minAge={18}
          isInvalid={error !== null}
          errorMessage={error?.message}
          classNames={{
            label: "text-small",
            input: "text-small"
          }}
        />
      </CardBody>

      <Spacer y={2} />
      <Divider />

      <CardFooter className="px-6 py-4">
        <div className="flex flex-col w-full gap-4">
          <Button
            color="primary"
            size="lg"
            onClick={handleVerification}
            isDisabled={!selectedDate || !hasAcknowledged || isLoading}
            isLoading={isLoading}
            className="w-full"
          >
            Continue
          </Button>

          {!isSignupFlow && (
            <>
              <div className="flex items-center gap-3">
                <Divider className="flex-1" />
                <span className="text-xs text-default-400">Or</span>
                <Divider className="flex-1" />
              </div>

              <Button
                variant="bordered"
                size="lg"
                onClick={() => verifyAge({
                  birthDate: new Date(),
                  method: 'modal',
                  isAnonymous: true,
                  hasAcknowledged
                })}
                isDisabled={!hasAcknowledged || isLoading}
                className="w-full"
              >
                <span>Continue Anonymously</span>
                <span className="text-xs text-default-400 ml-2">(Browse Only)</span>
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
