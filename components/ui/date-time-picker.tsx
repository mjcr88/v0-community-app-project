"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
    date?: Date
    setDate: (date: Date | undefined) => void
    placeholder?: string
    showTime?: boolean
}

export function DateTimePicker({
    date,
    setDate,
    placeholder = "Pick a date",
    showTime = false,
}: DateTimePickerProps) {
    // Convert Date to datetime-local format (YYYY-MM-DDTHH:mm)
    const dateTimeValue = date
        ? format(date, "yyyy-MM-dd'T'HH:mm")
        : ""

    const dateValue = date ? format(date, "yyyy-MM-dd") : ""

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (!value) {
            setDate(undefined)
            return
        }

        try {
            let newDate: Date;
            if (showTime) {
                newDate = new Date(value)
            } else {
                // Parse as local date at 00:00 to avoid UTC shifting
                newDate = parse(value, "yyyy-MM-dd", new Date())
            }

            if (!isNaN(newDate.getTime())) {
                setDate(newDate)
            }
        } catch (error) {
            console.error("Invalid date:", error)
        }
    }

    return (
        <div className="w-full">
            <Input
                type={showTime ? "datetime-local" : "date"}
                value={showTime ? dateTimeValue : dateValue}
                onChange={handleChange}
                onClick={(e) => e.currentTarget.showPicker()}
                placeholder={placeholder}
                className="w-full accent-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer cursor-pointer"
                style={{ colorScheme: 'light', accentColor: 'hsl(var(--primary))' }}
            />
        </div>
    )
}
