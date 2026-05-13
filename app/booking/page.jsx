'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react';

export default function BookingPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingStep, setBookingStep] = useState('select'); // 'select' | 'form' | 'success'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'consultation',
    notes: '',
  });

  // Generate time slots from 8 AM to 6 PM, every 30 minutes
  const timeSlots = [];
  for (let hour = 8; hour < 18; hour++) {
    timeSlots.push(`${hour}:00`);
    timeSlots.push(`${hour}:30`);
  }

  // Calendar logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const isWeekday = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday or Saturday
  };

  const isPastDate = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handleDateClick = (day) => {
    if (!isWeekday(day) || isPastDate(day)) return;
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    setSelectedTime(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // TODO: Save booking to Supabase
    // Example:
    // await supabase.from('bookings').insert({
    //   ...formData,
    //   date: selectedDate.toISOString(),
    //   time: selectedTime,
    // });
    // Then send confirmation email

    // For now, just show success
    setBookingStep('success');
  };

  const renderCalendarDays = () => {
    const days = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isDisabled = !isWeekday(day) || isPastDate(day);
      const isSelectedDay = isSelected(day);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`h-12 w-12 flex items-center justify-center text-sm transition-base ${
            isSelectedDay
              ? 'bg-brand text-white'
              : isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-brand hover:bg-brand-light cursor-pointer'
          }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  if (bookingStep === 'success') {
    return (
      <div className="pt-24 min-h-screen flex items-center">
        <div className="container-custom">
          <div className="max-w-md mx-auto text-center bg-white border border-brand-border p-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="font-serif text-3xl text-brand mb-4">Booking Confirmed!</h1>
            <p className="text-brand-gray mb-2">
              Your consultation is scheduled for
            </p>
            <p className="text-brand font-medium mb-1">
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-brand font-medium mb-6">at {selectedTime}</p>
            <p className="text-sm text-brand-gray mb-8">
              You'll receive a confirmation email shortly at {formData.email}.
            </p>
            <button
              onClick={() => {
                setBookingStep('select');
                setSelectedDate(null);
                setSelectedTime(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  service: 'consultation',
                  notes: '',
                });
              }}
              className="btn-primary"
            >
              Book Another Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24">
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-brand mb-2">
              Schedule your service
            </h1>
            <p className="text-brand-gray">
              Check out our availability and book the date and time that works for you
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-brand-border p-6">
                <h2 className="font-serif text-xl text-brand mb-6">Select a Date and Time</h2>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
                      )
                    }
                    className="p-2 hover:bg-brand-light transition-base"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="font-serif text-lg text-brand">{monthName}</h3>
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
                      )
                    }
                    className="p-2 hover:bg-brand-light transition-base"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="text-xs text-brand-gray text-center font-medium"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

                <p className="text-xs text-brand-gray mt-4 italic">
                  Available Monday – Friday, 8:00 AM – 6:00 PM (Japan Standard Time)
                </p>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="mt-6 bg-white border border-brand-border p-6">
                  <h2 className="font-serif text-xl text-brand mb-2">
                    Availability for{' '}
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                  <p className="text-xs text-brand-gray mb-4">
                    Japan Standard Time (GMT+9)
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 px-4 text-sm transition-base ${
                          selectedTime === slot
                            ? 'bg-brand text-white'
                            : 'bg-white border border-brand-border text-brand hover:border-brand'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Service Details / Form */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-brand-border p-6 sticky top-24">
                <h2 className="font-serif text-xl text-brand mb-4">Service Details</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-brand-gray mb-1">Service</label>
                    <select
                      value={formData.service}
                      onChange={(e) =>
                        setFormData({ ...formData, service: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                    >
                      <option value="consultation">Free Initial Consultation (45 min)</option>
                      <option value="inspection">Pre-Purchase Inspection (2 hr)</option>
                      <option value="management">Property Management (1 hr)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-brand-gray mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-brand-gray mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-brand-gray mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-brand-border text-sm focus:border-brand outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-brand-gray mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Tell us about your goals..."
                      className="w-full px-3 py-2 border border-brand-border text-sm focus:border-brand outline-none resize-none"
                    />
                  </div>

                  {selectedDate && selectedTime && (
                    <div className="bg-brand-light p-3 text-sm">
                      <div className="flex items-center gap-2 text-brand">
                        <Clock className="h-4 w-4" />
                        <span>
                          {selectedDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at {selectedTime}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedDate || !selectedTime}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Request to Book
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
