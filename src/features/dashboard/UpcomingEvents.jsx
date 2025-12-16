// src/features/dashboard/UpcomingEvents.jsx
import { useState, useEffect } from "react";
import { streamEvents } from "@/services/eventService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom"; // Dùng để điều hướng

import { useAuth } from "@/hooks/useAuth";

export function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useAuth();
  const navigate = useNavigate();

  const fetchEvents = () => {
    // streamEvents service đã được sửa để trả về mảng Event với Date object
    streamEvents((eventsData) => {
      setEvents(eventsData.slice(0, 3));
      setLoading(false);
    });
  };

  useEffect(() => {
    // Delay 300ms trước khi fetch để tránh giật lag khi chuyển nav nhanh
    const timeoutId = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleEventsUpdated = () => {
      fetchEvents();
    };
    socket.on("events:updated", handleEventsUpdated);
    return () => {
      socket.off("events:updated", handleEventsUpdated);
    };
  }, [socket]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sự kiện sắp diễn ra</CardTitle>
        <Button onClick={() => navigate('/utilities/team-calendar')} variant="link" className="p-0">
          Xem tất cả
        </Button>
      </CardHeader>
      <CardContent>
        {loading && <EventListSkeleton />}

        {!loading && events.length === 0 && (
          <p className="text-muted-foreground">Chưa có sự kiện nào.</p>
        )}

        {!loading && (
          <div className="space-y-4">
            {events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component con (để hiển thị gọn gàng)
function EventItem({ event }) {
  const eventDate = new Date(event.eventTimestamp);
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted text-muted-foreground">
        <span className="text-xs font-bold uppercase">
          {format(eventDate, "MMM", { locale: vi })}
        </span>
        <span className="text-lg font-bold">
          {format(eventDate, "dd")}
        </span>
      </div>
      <div>
        <p className="font-semibold">{event.title}</p>
        <p className="text-sm text-muted-foreground">
          {format(eventDate, "HH:mm")} @ {event.location}
        </p>
      </div>
    </div>
  );
}

// Skeleton (để ở cuối file cũng được)
function EventListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}