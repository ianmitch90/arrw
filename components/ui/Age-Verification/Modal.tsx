import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAgeVerification } from '@/contexts/AgeVerificationContext'
import { useToast } from '@/components/ui/toast'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Divider
} from '@heroui/react'
import { DatePicker } from '@/components/ui/date-picker'
import { m } from 'framer-motion'

interface AgeVerificationData {
  birthDate: Date
  method: 'modal'
  isAnonymous: boolean
}

export function AgeVerificationModal() {
  const router = useRouter()
  const { toast } = useToast()
  const { verifyAge, isLoading, error } = useAgeVerification()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleVerification = async () => {
    if (!selectedDate) {
      toast({
        type: 'error',
        title: 'Birth Date Required',
        description: 'Please select your birth date to continue.'
      })
      return
    }

    const age = calculateAge(selectedDate)
    if (age < 18) {
      toast({
        type: 'error',
        title: 'Age Requirement',
        description: 'You must be 18 or older to use this app.'
      })
      return
    }

    try {
      const data: AgeVerificationData = {
        birthDate: selectedDate,
        method: 'modal',
        isAnonymous: false
      }
      
      await verifyAge(data)
      
      toast({
        type: 'success',
        title: 'Age Verified',
        description: 'Welcome! You can now access all features.'
      })
      
      router.push('/onboarding')
    } catch (err) {
      toast({
        type: 'error',
        title: 'Verification Failed',
        description: error?.message || 'Please try again later.'
      })
    }
  }

  const handleAnonymousAccess = async () => {
    try {
      const data: AgeVerificationData = {
        birthDate: new Date(),
        method: 'modal',
        isAnonymous: true
      }
      
      await verifyAge(data)
      
      toast({
        type: 'info',
        title: 'Anonymous Access',
        description: 'You can now browse content with limited features.'
      })
      
      router.push('/browse')
    } catch (err) {
      toast({
        type: 'error',
        title: 'Access Failed',
        description: error?.message || 'Please try again later.'
      })
    }
  }

  return (
    <Modal 
      isOpen={true} 
      hideCloseButton
      isDismissable={false}
      className="max-w-md"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: 'easeOut'
            }
          },
          exit: {
            y: 20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: 'easeIn'
            }
          }
        }
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-xl font-bold">Age Verification Required</h2>
            <p className="text-sm text-default-500">
              You must be 18 or older to use this app. Please verify your age to continue.
            </p>
          </m.div>
        </ModalHeader>
        
        <ModalBody className="gap-6 pb-6">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <DatePicker
              label="Birth Date"
              placeholder="Select your birth date"
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              maxDate={new Date()}
              minAge={18}
              isInvalid={error !== null}
              errorMessage={error?.message}
            />
          </m.div>

          <m.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Button
              color="primary"
              size="lg"
              onClick={handleVerification}
              isDisabled={!selectedDate || isLoading}
              isLoading={isLoading}
              className="font-medium"
            >
              Verify Age
            </Button>
            
            <div className="flex items-center gap-3 py-2">
              <Divider className="flex-1" />
              <span className="text-xs text-default-400 px-2">Or</span>
              <Divider className="flex-1" />
            </div>

            <Button
              variant="bordered"
              size="lg"
              onClick={handleAnonymousAccess}
              isDisabled={isLoading}
              className="font-medium"
            >
              Continue Anonymously
              <span className="text-xs text-default-400">(Browse Only)</span>
            </Button>
          </m.div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
