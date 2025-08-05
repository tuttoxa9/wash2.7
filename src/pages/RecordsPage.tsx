import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/lib/context/AppContext';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import {
  Calendar,
  List,
  Plus,
  Grid3X3,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  ClockIcon
} from 'lucide-react';
import { appointmentService } from '@/lib/services/firebaseService';
import { toast } from 'sonner';
import type { Appointment } from '@/lib/types';

import Modal from '@/components/ui/modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SkeletonCard from '@/components/ui/SkeletonCard';
import SearchInput from '@/components/ui/SearchInput';
import FilterSelect from '@/components/ui/FilterSelect';
import AppointmentCard from '@/components/AppointmentCard';
import AppointmentForm from '@/components/AppointmentForm';

type ViewMode = 'list' | 'calendar' | 'grid';
type FilterStatus = 'all' | 'scheduled' | 'completed' | 'cancelled';

const RecordsPage: React.FC = () => {
  // Основное состояние
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Модальные окна
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  const { state, dispatch } = useAppContext();

  // Загрузка записей
  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      try {
        const appointments = await appointmentService.getAll();
        dispatch({ type: 'SET_APPOINTMENTS', payload: appointments });
      } catch (error) {
        console.error('Ошибка при загрузке записей:', error);
        toast.error('Не удалось загрузить записи');
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [dispatch]);

  // Подсчет записей по статусам
  const statusCounts = state.appointments.reduce((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Опции для фильтра статусов
  const statusFilterOptions = [
    { value: 'all', label: 'Все записи', count: state.appointments.length },
    { value: 'scheduled', label: 'Запланированные', count: statusCounts.scheduled || 0 },
    { value: 'completed', label: 'Выполненные', count: statusCounts.completed || 0 },
    { value: 'cancelled', label: 'Отмененные', count: statusCounts.cancelled || 0 }
  ];

  // Фильтрация записей
  const filteredAppointments = state.appointments.filter(appointment => {
    // Фильтр по статусу
    if (filterStatus !== 'all' && appointment.status !== filterStatus) {
      return false;
    }

    // Фильтр по поиску
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const carInfoMatch = appointment.carInfo.toLowerCase().includes(searchTermLower);
      const clientNameMatch = appointment.clientName?.toLowerCase().includes(searchTermLower) || false;
      const clientPhoneMatch = appointment.clientPhone?.toLowerCase().includes(searchTermLower) || false;
      const serviceMatch = appointment.service.toLowerCase().includes(searchTermLower);

      if (!carInfoMatch && !clientNameMatch && !clientPhoneMatch && !serviceMatch) {
        return false;
      }
    }

    // Фильтр по дате для календаря
    if (viewMode === 'calendar') {
      const appointmentDate = parseISO(appointment.date);
      const selected = new Date(selectedDate);
      return appointmentDate.getDate() === selected.getDate() &&
             appointmentDate.getMonth() === selected.getMonth() &&
             appointmentDate.getFullYear() === selected.getFullYear();
    }

    return true;
  });

  // Группировка записей для списка
  const getDateGroup = (dateString: string): string => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Сегодня';
    if (isTomorrow(date)) return 'Завтра';
    if (isThisWeek(date)) return 'Эта неделя';
    return format(date, 'MMMM yyyy', { locale: ru });
  };

  const groupedAppointments: Record<string, Appointment[]> = {};

  if (viewMode === 'list') {
    filteredAppointments.forEach(appointment => {
      const group = getDateGroup(appointment.date);
      if (!groupedAppointments[group]) {
        groupedAppointments[group] = [];
      }
      groupedAppointments[group].push(appointment);
    });

    // Сортировка записей в каждой группе по времени
    Object.keys(groupedAppointments).forEach(group => {
      groupedAppointments[group].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
    });
  }

  // Обработчики модальных окон
  const handleAddAppointment = (event: React.MouseEvent) => {
    setClickPosition({ x: event.clientX, y: event.clientY });
    setShowAddModal(true);
  };

  const handleEditAppointment = (appointment: Appointment, event: React.MouseEvent) => {
    setClickPosition({ x: event.clientX, y: event.clientY });
    setSelectedAppointment(appointment);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedAppointment(null);
    setClickPosition(null);
  };

  // Сохранение записи
  const handleSaveAppointment = async (formData: any) => {
    if (!formData.date || !formData.time || !formData.carInfo || !formData.service) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setSaving(true);
    try {
      if (showEditModal && selectedAppointment) {
        // Обновление существующей записи
        const updatedAppointment: Appointment = {
          ...selectedAppointment,
          ...formData
        };

        const success = await appointmentService.update(updatedAppointment);
        if (success) {
          dispatch({ type: 'UPDATE_APPOINTMENT', payload: updatedAppointment });
          toast.success('Запись успешно обновлена');
          handleCloseModal();
        } else {
          toast.error('Не удалось обновить запись');
        }
      } else {
        // Добавление новой записи
        const newAppointment: Omit<Appointment, 'id'> = {
          ...formData,
          createdAt: new Date()
        };

        const addedAppointment = await appointmentService.add(newAppointment);
        if (addedAppointment) {
          dispatch({ type: 'ADD_APPOINTMENT', payload: addedAppointment });
          toast.success('Запись успешно создана');
          handleCloseModal();
        } else {
          toast.error('Не удалось создать запись');
        }
      }
    } catch (error) {
      console.error('Ошибка при сохранении записи:', error);
      toast.error('Произошла ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  // Удаление записи
  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
      return;
    }

    try {
      const success = await appointmentService.delete(id);
      if (success) {
        dispatch({ type: 'REMOVE_APPOINTMENT', payload: id });
        toast.success('Запись успешно удалена');
      } else {
        toast.error('Не удалось удалить запись');
      }
    } catch (error) {
      console.error('Ошибка при удалении записи:', error);
      toast.error('Произошла ошибка при удалении');
    }
  };

  const ViewModeButton = ({ mode, icon: Icon, label }: { mode: ViewMode; icon: any; label: string }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
        viewMode === mode
          ? 'bg-primary text-primary-foreground shadow-lg'
          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-heading">Записи</h1>
          <p className="text-muted-foreground mt-1">
            Управление записями на автомойку
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddAppointment}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Создать запись
        </motion.button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-with-shadow text-center">
          <div className="p-2 mx-auto w-fit bg-blue-100 rounded-lg mb-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{statusCounts.scheduled || 0}</p>
          <p className="text-sm text-muted-foreground">Запланированных</p>
        </div>
        <div className="card-with-shadow text-center">
          <div className="p-2 mx-auto w-fit bg-green-100 rounded-lg mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{statusCounts.completed || 0}</p>
          <p className="text-sm text-muted-foreground">Выполненных</p>
        </div>
        <div className="card-with-shadow text-center">
          <div className="p-2 mx-auto w-fit bg-red-100 rounded-lg mb-2">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{statusCounts.cancelled || 0}</p>
          <p className="text-sm text-muted-foreground">Отмененных</p>
        </div>
        <div className="card-with-shadow text-center">
          <div className="p-2 mx-auto w-fit bg-purple-100 rounded-lg mb-2">
            <ClockIcon className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{state.appointments.length}</p>
          <p className="text-sm text-muted-foreground">Всего записей</p>
        </div>
      </div>

      {/* Фильтры и переключатели вида */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="card-with-shadow flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Поиск по авто, клиенту, телефону или услуге..."
            />
            <FilterSelect
              options={statusFilterOptions}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as FilterStatus)}
              label="Статус"
            />
          </div>
        </div>

        <div className="card-with-shadow">
          <div className="flex gap-2">
            <ViewModeButton mode="list" icon={List} label="Список" />
            <ViewModeButton mode="grid" icon={Grid3X3} label="Сетка" />
            <ViewModeButton mode="calendar" icon={Calendar} label="Календарь" />
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="card-with-shadow min-h-[600px]">
        {loading ? (
          <div className="space-y-4">
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Загрузка записей..." />
            </div>
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {Object.keys(groupedAppointments).length > 0 ? (
                  Object.entries(groupedAppointments).map(([group, appointments]) => (
                    <div key={group}>
                      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        {group}
                        <span className="text-sm bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {appointments.length}
                        </span>
                      </h3>
                      <div className="space-y-4">
                        {appointments.map((appointment, index) => (
                          <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onEdit={handleEditAppointment}
                            onDelete={handleDeleteAppointment}
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <CalendarDays className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Записи не найдены
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Нет записей, соответствующих выбранным критериям
                    </p>
                    <button
                      onClick={handleAddAppointment}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      Создать первую запись
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {viewMode === 'grid' && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment, index) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onEdit={handleEditAppointment}
                      onDelete={handleDeleteAppointment}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20">
                    <Grid3X3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Записи не найдены
                    </h3>
                    <p className="text-muted-foreground">
                      Нет записей, соответствующих выбранным критериям
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {viewMode === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col lg:flex-row gap-6"
              >
                <div className="lg:w-80">
                  <DayPicker
                    locale={ru}
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="bg-card p-4 rounded-xl border border-border"
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground",
                      day_today: "font-bold border border-primary",
                    }}
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
                    {filteredAppointments.length > 0 && (
                      <span className="text-sm bg-muted px-2 py-1 rounded-full text-muted-foreground">
                        {filteredAppointments.length}
                      </span>
                    )}
                  </h3>

                  <div className="space-y-4">
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((appointment, index) => (
                          <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onEdit={handleEditAppointment}
                            onDelete={handleDeleteAppointment}
                            index={index}
                          />
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Нет записей на выбранную дату
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Модальное окно для добавления/редактирования записи */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={handleCloseModal}
        clickPosition={clickPosition}
        className="max-w-2xl"
      >
        <AppointmentForm
          appointment={selectedAppointment}
          onSave={handleSaveAppointment}
          onCancel={handleCloseModal}
          loading={saving}
        />
      </Modal>
    </motion.div>
  );
};

export default RecordsPage;
