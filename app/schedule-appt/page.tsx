"use client";

import { FormEvent, useEffect, useState } from "react";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import Calendar from "../components/Calendar";
import supabase from "../../lib/supabase/client"


type ImageAttachment = {
  name: string;
  type: string;
  size: number;
  url: string;
};

type AppointmentForm = {
  doctor: string;
  patient: string;
  reason: string;
  time: string;
  location: string;
};

type AppointmentDetails = {
  title: string;
  dateText: string;
  doctor: string;
  patient: string;
  reason: string;
  location: string;
  attachments: ImageAttachment[];
};

const initialForm: AppointmentForm = {
  doctor: "",
  patient: "",
  reason: "",
  time: "09:00",
  location: "",
};

const doctorOptions = ["Dr. Smith", "Dr. House", "Dr. Rosario"];

const reasonOptions = [
  "Checkup",
  "Follow-up",
  "Prescription Review",
  "Lab Results",
];
const doctorLocationOptions: Record<string, string[]> = {
  "Dr. Smith": ["Clinic A", "Clinic B"],
  "Dr. House": ["Clinic C"],
  "Dr. Rosario": ["Clinic A", "Clinic C"],
};

export default function ScheduleApptPage() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState<AppointmentForm>(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [details, setDetails] = useState<AppointmentDetails | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  const openFormForDate = (isoDate: string) => setSelectedDate(isoDate);

  const closeForm = () => {
    setSelectedDate(null);
    setForm(initialForm);
    setFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDate) return;

    const start = form.time
      ? selectedDate + "T" + form.time + ":00"
      : selectedDate;
    const title = form.patient + " • " + form.doctor;

    const attachments: ImageAttachment[] = files.map((f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
      url: URL.createObjectURL(f),
    }));

    const newEvent: EventInput = {
      id: crypto.randomUUID(),
      title,
      start,
      allDay: !form.time,
      extendedProps: {
        doctor: form.doctor,
        patient: form.patient,
        reason: form.reason,
        location: form.location,
        attachments,
      },
    };

    setEvents((prev) => [...prev, newEvent]);
    closeForm();
  };

  const handleEventClick = (arg: EventClickArg) => {
    const { event } = arg;
    const p = event.extendedProps as {
      doctor?: string;
      patient?: string;
      reason?: string;
      location?: string;
      attachments?: ImageAttachment[];
    };

    setDetails({
      title: event.title,
      dateText: event.start ? event.start.toLocaleString() : "No date",
      doctor: p.doctor ?? "",
      patient: p.patient ?? "",
      reason: p.reason ?? "",
      location: p.location ?? "",
      attachments: p.attachments ?? [],
    });
  };

  const availableLocations = form.doctor
    ? (doctorLocationOptions[form.doctor] ?? [])
    : [];

  const handleDoctorChange = (doctor: string) => {
    setForm((prev) => {
      const nextLocations = doctorLocationOptions[doctor] ?? [];
      const keepCurrentLocation = nextLocations.includes(prev.location);

      return {
        ...prev,
        doctor,
        location: keepCurrentLocation ? prev.location : "",
      };
    });
  };

  useEffect(() => {
    return () => {
      events.forEach((ev) => {
        const p = ev.extendedProps as
          | { attachments?: ImageAttachment[] }
          | undefined;
        p?.attachments?.forEach((img) => URL.revokeObjectURL(img.url));
      });
    };
  }, [events]);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase!.auth.getUser();
      if (user) {
        const Fullname = user.user_metadata?.full_name || user.email || "";
        const first = Fullname.split(" ")[0] || Fullname.split("@")[0];
        setFirstName(first)
      }
    }
    fetchUser();
  })

  return (
    <div className="p-4">
      <h1 className="mx-auto mb-4 w-fit text-2xl font-semibold text-center">
       Hello{firstName ? `, ${firstName}` : ""} Schedule your Appointment.
      </h1>

      <Calendar
        events={events}
        onDateClick={openFormForDate}
        onEventClick={handleEventClick}
      />

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-3 rounded-xl border border-zinc-700 bg-zinc-900 p-5 text-zinc-100 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">New Appointment</h2>
            <p className="text-sm text-zinc-400">
              Selected date: {selectedDate}
            </p>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">Doctor</span>
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
                value={form.doctor}
                onChange={(e) => handleDoctorChange(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select doctor
                </option>
                {doctorOptions.map((doctor) => (
                  <option key={doctor} value={doctor}>
                    {doctor}
                  </option>
                ))}
              </select>
            </label>

            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
              value={form.patient}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, patient: e.target.value }))
              }
              placeholder="Patient"
              required
            />

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">Reason</span>
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
                value={form.reason}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Select reason
                </option>
                {reasonOptions.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">Location</span>
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 disabled:opacity-50"
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                required
                disabled={!form.doctor}
              >
                <option value="" disabled>
                  {form.doctor ? "Select location" : "Select doctor first"}
                </option>
                {availableLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <input
              type="time"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
              value={form.time}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, time: e.target.value }))
              }
            />

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border border-zinc-600 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                Save Appointment
              </button>
            </div>
          </form>
        </div>
      )}

      {details && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl space-y-3 rounded-xl border border-zinc-700 bg-zinc-900 p-5 text-zinc-100 shadow-2xl">
            <h2 className="text-lg font-semibold">{details.title}</h2>
            <p className="text-sm text-zinc-400">{details.dateText}</p>
            <p>
              <strong>Doctor:</strong> {details.doctor}
            </p>
            <p>
              <strong>Patient:</strong> {details.patient}
            </p>
            <p>
              <strong>Reason:</strong> {details.reason}
            </p>
            <p>
              <strong>Location:</strong> {details.location}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {details.attachments.map((img) => (
                <a
                  key={img.url}
                  href={img.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-32 w-full rounded-md object-cover border border-zinc-700"
                  />
                </a>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setDetails(null)}
                className="rounded-md border border-zinc-600 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
