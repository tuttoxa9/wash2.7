import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Car, Wrench, User, Phone, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import LoadingSpinner from './ui/LoadingSpinner';
import type { Appointment } from '@/lib/types';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  date: string;
  time: string;
  carInfo: string;
  service: string;
  clientName?: string;
  clientPhone?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  onSave,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    carInfo: '',
    service: '',
    clientName: '',
    clientPhone: '',
    status: 'scheduled'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (appointment) {
      setFormData({
        date: appointment.date,
        time: appointment.time,
        carInfo: appointment.carInfo,
        service: appointment.service,
        clientName: appointment.clientName || '',
        clientPhone: appointment.clientPhone || '',
        status: appointment.status
      });
    }
  }, [appointment]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Дата обязательна';
    if (!formData.time) newErrors.time = 'Время обязательно';
    if (!formData.carInfo.trim()) newErrors.carInfo = 'Информация об авто обязательна';
    if (!formData.service.trim()) newErrors.service = 'Услуга обязательна';

    if (formData.clientPhone && !/^[\d\s\+\-\(\)]+$/.test(formData.clientPhone)) {
      newErrors.clientPhone = 'Неверный формат телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      await onSave(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Очистить ошибку для текущего поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const inputClasses = (fieldName: string) => cn(
    "w-full px-4 py-3 border rounded-xl bg-background text-foreground transition-all duration-200",
    "placeholder:text-muted-foreground",
    "focus:border-primary focus:ring-2 focus:ring-primary/20",
    errors[fieldName] ? "border-destructive" : "border-input hover:border-border/80"
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="p-8 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-foreground">
          {appointment ? 'Редактировать запись' : 'Новая запись'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Дата и время */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              Дата
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={inputClasses('date')}
              required
            />
            {errors.date && (
              <p className="text-destructive text-xs mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              Время
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={inputClasses('time')}
              required
            />
            {errors.time && (
              <p className="text-destructive text-xs mt-1">{errors.time}</p>
            )}
          </div>
        </div>

        {/* Информация об авто */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
            <Car className="w-4 h-4 text-primary" />
            Автомобиль и госномер
          </label>
          <input
            type="text"
            name="carInfo"
            value={formData.carInfo}
            onChange={handleChange}
            placeholder="Например: Toyota Camry А123БВ777"
            className={inputClasses('carInfo')}
            required
          />
          {errors.carInfo && (
            <p className="text-destructive text-xs mt-1">{errors.carInfo}</p>
          )}
        </div>

        {/* Услуга */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
            <Wrench className="w-4 h-4 text-primary" />
            Услуга
          </label>
          <input
            type="text"
            name="service"
            value={formData.service}
            onChange={handleChange}
            placeholder="Например: Комплексная мойка"
            className={inputClasses('service')}
            required
          />
          {errors.service && (
            <p className="text-destructive text-xs mt-1">{errors.service}</p>
          )}
        </div>

        {/* Информация о клиенте */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
              <User className="w-4 h-4 text-primary" />
              Имя клиента <span className="text-muted-foreground">(опционально)</span>
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Введите имя клиента"
              className={inputClasses('clientName')}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
              <Phone className="w-4 h-4 text-primary" />
              Телефон <span className="text-muted-foreground">(опционально)</span>
            </label>
            <input
              type="tel"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handleChange}
              placeholder="+7 (xxx) xxx-xx-xx"
              className={inputClasses('clientPhone')}
            />
            {errors.clientPhone && (
              <p className="text-destructive text-xs mt-1">{errors.clientPhone}</p>
            )}
          </div>
        </div>

        {/* Статус (только при редактировании) */}
        {appointment && (
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Статус записи
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={inputClasses('status')}
            >
              <option value="scheduled">Запланирована</option>
              <option value="completed">Выполнена</option>
              <option value="cancelled">Отменена</option>
            </select>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-input rounded-xl hover:bg-secondary/50 transition-colors text-foreground"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "px-6 py-3 bg-primary text-primary-foreground rounded-xl transition-all duration-200",
              "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2 font-medium"
            )}
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AppointmentForm;
