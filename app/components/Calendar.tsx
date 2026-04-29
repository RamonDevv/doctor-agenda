"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import type { EventContentArg, EventInput, EventClickArg } from "@fullcalendar/core";

type CalendarProps = {
  events: EventInput[];
  onDateClick: (isoDate: string) => void;
  onEventClick: (arg: EventClickArg) => void;
};

export default function Calendar({ events, onDateClick, onEventClick }: CalendarProps) {
  const handleDateClick = (info: DateClickArg) => {
    onDateClick(info.dateStr);
  };

  return (
    <div className="calendar-shell">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="85vh"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth",
        }}
        dayMaxEventRows={2}
        events={events}
        dateClick={handleDateClick}
        eventClick={onEventClick}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: true }}
        displayEventTime
        eventContent={renderEventContent}
        eventClassNames="fc-event-clean"
      />
    </div>
  );
}

function renderEventContent(eventInfo: EventContentArg) {
  return (
    <div className="fc-event-inner">
      {eventInfo.timeText ? <span className="fc-event-time">{eventInfo.timeText}</span> : null}
      <span className="fc-event-title">{eventInfo.event.title}</span>
    </div>
  );
}