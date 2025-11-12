// src/pages/TeamCalendarPage.jsx
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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

// Animation
const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};


export function TeamCalendarPage() {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [eventToEdit, setEventToEdit] = useState(null); // Sự kiện đang sửa
  const [eventToDelete, setEventToDelete] = useState(null); // Sự kiện đang chờ xóa
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // "Nghe" (stream) sự kiện
  useEffect(() => {
    const unsubscribe = streamEvents((eventsData) => {
      setAllEvents(eventsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const eventDays = useMemo(() => {
    return allEvents.map((event) => event.eventTimestamp.toDate());
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) =>
      isSameDay(event.eventTimestamp.toDate(), selectedDate)
    );
  }, [allEvents, selectedDate]);

  const handleEventSubmit = async (dataToSubmit) => { // 'dataToSubmit' đã được xử lý ở Form
    try {

      if (eventToEdit) {
        await updateEvent(eventToEdit.id, dataToSubmit);
      } else {
        await addEvent(dataToSubmit);
      }
      
      handleDialogClose(); // Đóng dialog
    } catch (error) {
      console.error("Lỗi khi submit:", error);
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
      setShowDeleteDialog(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
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
        <Button asChild variant="outline">
          <Link to="/utilities">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Link>
        </Button>
        <Dialog open={openAddDialog || !!eventToEdit} onOpenChange={handleOpenStateChange}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpenAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sự kiện
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {eventToEdit ? "Sửa sự kiện" : "Tạo sự kiện team mới"}
              </DialogTitle>
            </DialogHeader>
            <AddEventForm
              onSubmit={handleEventSubmit}  // <-- Dùng hàm submit mới
              onSuccess={handleDialogClose} // <-- Dùng hàm đóng mới
              eventToEdit={eventToEdit}     // <-- Truyền event cần sửa
            />
          </DialogContent>
        </Dialog>
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
            {filteredEvents.length === 0 && (
              <p className="text-muted-foreground">Không có sự kiện nào cho ngày này.</p>
            )}
            {filteredEvents.map((event) => (
              <EventItem 
                key={event.id} 
                event={event} 
                onEdit={() => handleEdit(event)}   
                onDelete={() => handleDelete(event)}
              />
            ))}
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
function EventItem({ event, onEdit, onDelete }) {
  const eventDate = event.eventTimestamp.toDate();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            {format(eventDate, "eeee, dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
          </CardDescription>
        </div>
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
      </CardHeader>
      <CardContent>
        <p><strong>Địa điểm:</strong> {event.location}</p>
        {event.description && <p className="mt-2 text-muted-foreground">{event.description}</p>}
      </CardContent>
    </Card>
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