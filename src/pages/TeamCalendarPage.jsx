// src/pages/TeamCalendarPage.jsx
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, MoreHorizontal } from "lucide-react";
import { streamEvents, addEvent, updateEvent, deleteEvent } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddEventForm } from "@/features/utilities/AddEventForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar"; // Lịch lớn để hiển thị
import { format, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { ScrollHideFab } from "@/components/common/ScrollHideFab";

// Animation
const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};


export function TeamCalendarPage() {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [eventToEdit, setEventToEdit] = useState(null); // Sự kiện đang sửa
  const [eventToDelete, setEventToDelete] = useState(null); // Sự kiện đang chờ xóa
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // "Nghe" (stream) sự kiện
  const { socket } = useAuth();

  const fetchEventsData = async () => {
    // streamEvents giờ chỉ gọi 1 lần (đã sửa trong service) hoặc dùng getEvents
    // Để đơn giản ta dùng lại cấu trúc cũ nhưng streamEvents bây giờ trả về mảng Event đã parse Date
    streamEvents((eventsData) => {
      setAllEvents(eventsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    // Delay 300ms trước khi fetch để tránh giật lag khi chuyển nav nhanh
    const timeoutId = setTimeout(() => {
      fetchEventsData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  // Real-time listener
  useEffect(() => {
    if (!socket) return;
    const handleEventsUpdated = () => {
      fetchEventsData();
    };
    socket.on("events:updated", handleEventsUpdated);
    return () => {
      socket.off("events:updated", handleEventsUpdated);
    };
  }, [socket]);

  const eventDays = useMemo(() => {
    // eventsData.eventTimestamp đã là Date object (do service xử lý), không cần .toDate()
    return allEvents.map((event) => new Date(event.eventTimestamp));
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) =>
      isSameDay(new Date(event.eventTimestamp), selectedDate)
    );
  }, [allEvents, selectedDate]);

  const handleEventSubmit = async (dataToSubmit) => { // 'dataToSubmit' đã được xử lý ở Form
    try {

      if (eventToEdit) {
        await updateEvent(eventToEdit.id, dataToSubmit);
        toast.success("Sửa sự kiện thành công!");
      } else {
        await addEvent(dataToSubmit);
        toast.success("Thêm sự kiện thành công!");
      }

      handleDialogClose(); // Đóng dialog
    } catch (error) {
      console.error("Lỗi khi submit:", error);
      toast.error("Có lỗi xảy ra. Hãy thử lại!");
    }
  };

  // Đóng dialog (dùng cho cả Thêm và Sửa)
  const handleDialogClose = () => {
    setOpenAddDialog(false);
    setEventToEdit(null);
  };

  // Mở dialog Sửa
  const handleEdit = (event) => {
    setEventToEdit(event);
  };

  // Mở dialog Xóa
  const handleDelete = (event) => {
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  // Xác nhận Xóa
  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent(eventToDelete.id);
      toast.success("Xóa sự kiện thành công!");
      setShowDeleteDialog(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      toast.error("Có lỗi xảy ra khi xóa.");
    }
  };
  const handleOpenStateChange = (isOpen) => {
    if (!isOpen) {
      handleDialogClose();
    }
  };
  return (
    <motion.div variants={pageAnimation} initial="initial" animate="animate">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate("/utilities")}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        {isAdmin && (
          <Dialog open={openAddDialog || !!eventToEdit} onOpenChange={handleOpenStateChange}>
            <div className="hidden md:block">
              <DialogTrigger asChild>
                <Button onClick={() => setOpenAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm sự kiện
                </Button>
              </DialogTrigger>
            </div>
            <div className="md:hidden">
              <DialogTrigger asChild>
                <ScrollHideFab icon={Plus} onClick={() => setOpenAddDialog(true)} />
              </DialogTrigger>
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {eventToEdit ? "Sửa sự kiện" : "Tạo sự kiện team mới"}
                </DialogTitle>
              </DialogHeader>
              <AddEventForm
                onSubmit={handleEventSubmit}
                onSuccess={handleDialogClose}
                eventToEdit={eventToEdit}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột 1: Lịch */}
        <Card>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full"
              locale={vi}
              modifiers={{ hasEvent: eventDays }}
              modifiersClassNames={{ hasEvent: "day-has-event" }}
            />
          </CardContent>
        </Card>

        {/* Cột 2: Danh sách sự kiện */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Sự kiện ngày {selectedDate ? format(selectedDate, "dd/MM", { locale: vi }) : "..."}
          </h2>
          <div className="space-y-4">
            {loading ? (
              <EventListSkeleton />
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredEvents.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-muted-foreground"
                  >
                    Không có sự kiện nào cho ngày này.
                  </motion.p>
                )}
                {filteredEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onEdit={() => handleEdit(event)}
                    onDelete={() => handleDelete(event)}
                    isAdmin={isAdmin}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn sự kiện
              <span className="font-bold"> "{eventToDelete?.title}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// Card con cho từng sự kiện
function EventItem({ event, onEdit, onDelete, isAdmin }) {
  const eventDate = new Date(event.eventTimestamp);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{event.title}</CardTitle>
            <CardDescription>
              {format(eventDate, "eeee, dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
            </CardDescription>
          </div>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onEdit}>Sửa</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-500">
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          <p><strong>Địa điểm:</strong> {event.location}</p>
          {event.description && <p className="mt-2 text-muted-foreground">{event.description}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton
function EventListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}