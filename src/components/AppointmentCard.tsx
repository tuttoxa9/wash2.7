import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Edit, Trash2, User, Phone, Car, Wrench } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/lib/types';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment, event: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  index: number;
}

const statusConfig = {
  scheduled: {
    bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    badge: 'bg-blue-100 text-blue-800',
    label: 'Запланирована',
    darkBg: 'dark:bg-blue-950 dark:border-blue-900 dark:hover:bg-blue-900/50',
    darkBadge: 'dark:bg-blue-900 dark:text-blue-100'
  },
  completed: {
    bg: 'bg-green-50 border-green-200 hover:bg-green-100',
    badge: 'bg-green-100 text-green-800',
    label: 'Выполнена',
    darkBg: 'dark:bg-green-950 dark:border-green-900 dark:hover:bg-green-900/50',
    darkBadge: 'dark:bg-green-900 dark:text-green-100'
  },
  cancelled: {
    bg: 'bg-red-50 border-red-200 hover:bg-red-100',
    badge: 'bg-red-100 text-red-800',
    label: 'Отменена',
    darkBg: 'dark:bg-red-950 dark:border-red-900 dark:hover:bg-red-900/50',
    darkBadge: 'dark:bg-red-900 dark:text-red-100'
  }
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onEdit,
  onDelete,
  index
}) => {
  const config = statusConfig[appointment.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      className={cn(
        "p-6 rounded-2xl border transition-all duration-300 ease-in-out group cursor-pointer",
        config.bg,
        config.darkBg,
        "hover:shadow-lg hover:scale-[1.02]"
      )}
      onClick={() => {}}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-3 flex-1">
          {/* Основная информация */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {appointment.carInfo}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <Wrench className="w-4 h-4" />
                <span className="text-sm">{appointment.service}</span>
              </div>
            </div>
          </div>

          {/* Дата и время */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium">
                {format(parseISO(appointment.date), 'dd MMMM yyyy', { locale: ru })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">{appointment.time}</span>
            </div>
          </div>

          {/* Информация о клиенте */}
          {(appointment.clientName || appointment.clientPhone) && (
            <div className="space-y-1">
              {appointment.clientName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{appointment.clientName}</span>
                </div>
              )}
              {appointment.clientPhone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{appointment.clientPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Статус */}
          <div>
            <span className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
              config.badge,
              config.darkBadge
            )}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(appointment, e);
            }}
            className="p-2 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-primary transition-colors"
            title="Редактировать"
          >
            <Edit className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(appointment.id);
            }}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default AppointmentCard;
