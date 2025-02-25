// app/calendar/page.tsx
"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarPage() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">Calendar</h1>
      <div className="w-full h-[70vh]">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="100%" // Ensures the calendar takes full height
          events={[
            { title: "Meeting", date: new Date().toISOString().split("T")[0] },
          ]}
        />
      </div>
    </div>
  );
}
