import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const today = new Date();
  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-calendar-title">Content Calendar</h1>
              <p className="text-sm text-muted-foreground">Plan and schedule your video content</p>
            </div>
          </div>

          <Button data-testid="button-schedule-script">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Script
          </Button>
        </div>

        <Card className="p-6 bg-card border-card-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" data-testid="text-current-month">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} data-testid="button-prev-month">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-next-month">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                className={`min-h-24 p-2 rounded-md border ${
                  day
                    ? isToday(day)
                      ? "border-primary bg-primary/10"
                      : "border-muted hover-elevate cursor-pointer"
                    : "border-transparent"
                }`}
                data-testid={day ? `calendar-day-${day}` : undefined}
              >
                {day && (
                  <span
                    className={`text-sm font-medium ${
                      isToday(day) ? "text-primary" : ""
                    }`}
                  >
                    {day}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Upcoming</h3>
          <Card className="p-8 bg-card border-card-border text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-no-scheduled">
              No scheduled content yet. Click "Schedule Script" to add your first post.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
