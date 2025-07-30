// src/components/ui/date-picker-dialog.tsx

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePickerDialog({
  open,
  onOpenChange,
  onSelectDate,
  minDate,
  maxDate,
}: DatePickerDialogProps) {
  const [date, setDate] = React.useState<Date | undefined>()

  const handleSave = () => {
    if (date) {
      onSelectDate(date)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Relocate Task</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
            <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) =>
                (minDate && date < minDate) || (maxDate && date > maxDate) || false
            }
            initialFocus
            />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!date}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}