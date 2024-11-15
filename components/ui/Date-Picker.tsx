import React, { useCallback } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Input,
  Button,
  Select,
  SelectItem,
  ScrollShadow
} from '@nextui-org/react'
import { format, isValid } from 'date-fns'
import { m } from 'framer-motion'
import { Icon } from '@iconify/react'

interface DatePickerProps {
  label?: string
  placeholder?: string
  selectedDate?: Date
  onDateChange: (date: Date) => void
  maxDate?: Date
  minDate?: Date
  minAge?: number
  isInvalid?: boolean
  errorMessage?: string
  description?: string
}

export function DatePicker({
  label,
  placeholder = 'Select date',
  selectedDate,
  onDateChange,
  maxDate = new Date(),
  minDate,
  minAge,
  isInvalid,
  errorMessage,
  description
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const calculateMinDate = useCallback(() => {
    if (minDate) return minDate
    if (minAge) {
      const date = new Date()
      date.setFullYear(date.getFullYear() - minAge)
      return date
    }
    return undefined
  }, [minDate, minAge])

  const years = Array.from({ length: 100 }, (_, i) => ({
    value: String(maxDate.getFullYear() - i),
    label: String(maxDate.getFullYear() - i)
  }))

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ].map((month, index) => ({
    value: String(index),
    label: month
  }))

  const [selectedYear, setSelectedYear] = React.useState<number>(
    selectedDate?.getFullYear() || maxDate.getFullYear()
  )
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    selectedDate?.getMonth() || maxDate.getMonth()
  )

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const handleDaySelect = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day)
    const minAllowedDate = calculateMinDate()
    
    if (minAllowedDate && date > minAllowedDate) {
      return
    }
    
    if (date > maxDate) {
      return
    }
    
    onDateChange(date)
    setIsOpen(false)
  }

  const formattedDate = selectedDate && isValid(selectedDate) 
    ? format(selectedDate, 'PP') 
    : ''

  return (
    <Popover 
      isOpen={isOpen} 
      onOpenChange={setIsOpen}
      placement="bottom"
      showArrow
      backdrop="blur"
    >
      <PopoverTrigger>
        <Input
          label={label}
          placeholder={placeholder}
          value={formattedDate}
          readOnly
          isInvalid={isInvalid}
          errorMessage={errorMessage}
          description={description}
          endContent={
            <Icon 
              icon="solar:calendar-bold" 
              className={`text-xl ${isInvalid ? 'text-danger' : 'text-default-400'}`}
            />
          }
        />
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-[360px]">
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 space-y-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Year"
              selectedKeys={[String(selectedYear)]}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              size="sm"
            >
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Month"
              selectedKeys={[String(selectedMonth)]}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              size="sm"
            >
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          
          <ScrollShadow className="max-h-[280px]">
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div 
                  key={day} 
                  className="text-tiny text-default-500 font-medium py-1"
                >
                  {day}
                </div>
              ))}
              
              {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => {
                const day = i + 1
                const date = new Date(selectedYear, selectedMonth, day)
                const minAllowedDate = calculateMinDate()
                const isDisabled = (
                  (minAllowedDate && date > minAllowedDate) ||
                  date > maxDate
                )
                const isSelected = selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === selectedMonth &&
                  selectedDate?.getFullYear() === selectedYear
                
                return (
                  <Button
                    key={day}
                    size="sm"
                    variant={isSelected ? "solid" : "light"}
                    color={isSelected ? "primary" : "default"}
                    isDisabled={isDisabled}
                    onClick={() => handleDaySelect(day)}
                    className="w-8 h-8 p-0"
                  >
                    {day}
                  </Button>
                )
              })}
            </div>
          </ScrollShadow>
        </m.div>
      </PopoverContent>
    </Popover>
  )
}
