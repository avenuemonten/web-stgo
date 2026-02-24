import React, { useState, useMemo, useEffect } from 'react';
import styles from './InvExecute.module.css';
import { useWorkers } from '../../../Store/navigationStore';
import { IonChip, IonIcon, IonSpinner } from '@ionic/react';
import { Invoice } from './InvoiceList/InvoiceItem';
import { 
  closeOutline, personOutline, statsChartOutline, chatbubbleOutline, 
  star, checkmarkCircle, alertCircle, timeOutline, flagOutline, saveOutline,
  searchOutline, filterOutline, constructOutline, closeCircleOutline,
  addOutline,
  addCircleOutline
} from 'ionicons/icons';

interface Executor {
  id: string; name: string; role: string;
  rating: number; currentWorkload: number; isAvailable: boolean;
}

// ВЕРНУЛ ПРАВИЛЬНЫЕ СТАТУСЫ, КОТОРЫЕ ПОНИМАЕТ СЕРВЕР
type WorkStatus = 'В работе' | 'Выполнена' | 'Отложена' | 'Отменена' | 'Новый';

interface ActExecutionModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onAssignToExecutor: (data: { worker: Executor; comment: string; priority: string; status: WorkStatus; }) => Promise<void>;
}

// Логика переключения следующего статуса
const getNextStatus = (current: string): WorkStatus => {
    if (current === "Новый") return "В работе";
    if (current === "В работе") return "Выполнена";
    return 'В работе';
}

export const InvExecute: React.FC<ActExecutionModalProps> = ({
  invoice, isOpen, onClose, onAssignToExecutor
}) => {
  // ФИКС: Сразу ищем текущего исполнителя в списке, чтобы он был выбран
  const { workers } = useWorkers();

  const executors: Executor[] = useMemo(() => {
    return workers.map((worker: any) => ({
      id: worker.id || Math.random().toString(),
      name: worker.name || 'Неизвестный',
      role: worker.role || 'Специалист',
      rating: worker.rating || 5.0,
      currentWorkload: worker.currentWorkload || 0,
      isAvailable: worker.isAvailable !== false
    }));
  }, [workers]);

  // Находим текущего работника заявки
  const currentExecutor = useMemo(() => {
     if (!invoice.worker) return undefined;
     return executors.find(e => e.name === invoice.worker.name || e.id === invoice.worker.id);
  }, [invoice.worker, executors]);

  const [selectedExecutor, setSelectedExecutor] = useState<any>(currentExecutor);
  const [comment, setComment] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  
  // Ставим статус, который сервер ждет
  const [status, setStatus] = useState<WorkStatus>(invoice.status as WorkStatus);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [executorDropdownOpen, setExecutorDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Поиск и фильтры
  const [searchText, setSearchText] = useState('');
  const [filterWorkload, setFilterWorkload] = useState<'all' | 'low' | 'high'>('all');
  const [filterRating, setFilterRating] = useState<boolean>(false);

  // Если вдруг executors подгрузились позже, обновляем выбранного
  useEffect(() => {
     if (currentExecutor && !selectedExecutor) {
         setSelectedExecutor(currentExecutor);
     }
  }, [currentExecutor]);

  const filteredExecutors = useMemo(() => {
    return executors
      .filter(ex => {
        if (searchText && !ex.name.toLowerCase().includes(searchText.toLowerCase())) return false;
        if (filterWorkload === 'low' && ex.currentWorkload > 3) return false;
        if (filterWorkload === 'high' && ex.currentWorkload < 5) return false;
        return true;
      })
      .sort((a, b) => {
        if (filterRating) return b.rating - a.rating;
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        return 0;
      });
  }, [executors, searchText, filterWorkload, filterRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Разрешаем сохранять, даже если исполнитель не менялся (если он был)
    if (!selectedExecutor) return;

    setIsSubmitting(true);
    try {
      await onAssignToExecutor({ worker: selectedExecutor, comment, priority, status });
      onClose();
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWorkloadText = (workload: number) => {
    if (workload < 3) return 'Низкая';
    if (workload < 6) return 'Средняя';
    return 'Высокая';
  };

  const getWorkloadClass = (workload: number) => {
    if (workload < 3) return styles.workloadLow;
    if (workload < 6) return styles.workloadMedium;
    return styles.workloadHigh;
  };

  // Правильные цвета для статусов
  const getStatusColor = (st: WorkStatus) => {
      switch(st) {
          case 'Выполнена': return 'success';
          case 'В работе':  return 'warning'; // Оранжевый для "В работе"
          case 'Отменена':  return 'danger';
          case 'Новый':     return 'primary';
          case 'Отложена':  return 'medium';
          default:          return 'primary';
      }
  };

  const getStatusIcon = (st: WorkStatus) => {
    switch (st) {
      case 'Новый':     return addCircleOutline;
      case 'В работе':  return constructOutline;
      case 'Выполнена': return checkmarkCircle;
      case 'Отложена':  return alertCircle;
      case 'Отменена':  return closeCircleOutline;
      default:          return statsChartOutline;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Исполнение заявки</div>
          <button onClick={onClose} className={styles.closeButton}>
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.invoiceInfo}>
            <div className={styles.infoHeader}>
              <h3>#{invoice.number?.trim()}</h3>
              <div className={styles.statusChip}>{invoice.status}</div>
            </div>
            <div className={styles.infoGrid}>
               <div className={styles.infoItem}>
                 <span className={styles.infoLabel}>Адрес:</span>
                 <span className={styles.infoValue}>{invoice.address?.address}</span>
               </div>
               <div className={styles.infoItem}>
                 <span className={styles.infoLabel}>Задача:</span>
                 <span className={styles.infoValue}>{invoice.service || invoice.character || 'Нет описания'}</span>
               </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.executionForm}>
            
            {/* 1. СТАТУС: иконка + "Новый статус" + текущий статус в одной строке, по клику — список */}
            <div className={styles.formSection}>
              <button
                type="button"
                className={styles.statusRow}
                onClick={() => setStatusDropdownOpen((v) => !v)}
                aria-expanded={statusDropdownOpen}
              >
                <IonIcon icon={statsChartOutline} className={styles.labelIcon} />
                <span className={styles.statusLabel}>Новый статус</span>
                <IonChip
                  outline={false}
                  color={getStatusColor(status)}
                  className={styles.statusCurrentChip}
                >
                  <IonIcon icon={getStatusIcon(status)} />
                  <span style={{ marginLeft: 4 }}>{status}</span>
                </IonChip>
              </button>
              {statusDropdownOpen && (
                <div className={styles.statusOptions}>
                  {(['Новый', 'В работе', 'Выполнена', 'Отложена', 'Отменена'] as WorkStatus[]).map((st) => (
                    <IonChip
                      key={st}
                      outline={status !== st}
                      color={getStatusColor(st)}
                      onClick={() => {
                        setStatus(st);
                        setStatusDropdownOpen(false);
                      }}
                    >
                      <IonIcon icon={getStatusIcon(st)} />
                      <span style={{ marginLeft: 4 }}>{st}</span>
                    </IonChip>
                  ))}
                </div>
              )}
            </div>

            {/* 2. ИСПОЛНИТЕЛЬ */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <label className={styles.sectionLabel}>
                  <IonIcon icon={personOutline} className={styles.labelIcon} />
                  Исполнитель
                </label>
              </div>

              {/* Один айтем: выбранный исполнитель или плейсхолдер */}
              <div
                className={styles.executorCard}
                onClick={() => setExecutorDropdownOpen((v) => !v)}
              >
                {selectedExecutor ? (
                  <>
                    <div className={styles.executorMain}>
                      <div className={styles.executorName}>
                        {selectedExecutor.name}{' '}
                        <span className={styles.executorRole}>{selectedExecutor.role}</span>
                      </div>
                      <div className={styles.executorRating}>
                        <IonIcon icon={star} /> {selectedExecutor.rating.toFixed(1)}
                      </div>
                    </div>
                    <div className={styles.executorMeta}>
                      <div className={`${styles.workloadBadge} ${getWorkloadClass(selectedExecutor.currentWorkload)}`}>
                        Загрузка: {getWorkloadText(selectedExecutor.currentWorkload)}
                      </div>
                      <div className={selectedExecutor.isAvailable ? styles.available : styles.unavailable}>
                        {selectedExecutor.isAvailable ? 'Доступен' : 'Занят'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.executorPlaceholderText}>Исполнитель не выбран</div>
                )}
              </div>

              {/* Полный список открывается только по клику по айтему */}
              {executorDropdownOpen && (
                <>
                  <div className={styles.searchContainer}>
                    <IonIcon icon={searchOutline} className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Поиск сотрудника..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>

                  <div className={styles.filtersContainer}>
                    <button
                      type="button"
                      className={`${styles.filterChip} ${filterWorkload === 'all' && !filterRating ? styles.filterChipActive : ''}`}
                      onClick={() => {
                        setFilterWorkload('all');
                        setFilterRating(false);
                      }}
                    >
                      Все
                    </button>
                    <button
                      type="button"
                      className={`${styles.filterChip} ${filterWorkload === 'low' ? styles.filterChipActive : ''}`}
                      onClick={() =>
                        setFilterWorkload(filterWorkload === 'low' ? 'all' : 'low')
                      }
                    >
                      Мало задач
                    </button>
                    <button
                      type="button"
                      className={`${styles.filterChip} ${filterRating ? styles.filterChipActive : ''}`}
                      onClick={() => setFilterRating(!filterRating)}
                    >
                      Высокий рейтинг
                    </button>
                  </div>

                  <div className={styles.executorsList}>
                    {filteredExecutors.length === 0 ? (
                      <div className={styles.emptyState}>Нет сотрудников по запросу</div>
                    ) : (
                      filteredExecutors.map((ex) => (
                        <div
                          key={ex.id}
                          className={`${styles.executorCard} ${
                            selectedExecutor?.id === ex.id ? styles.executorSelected : ''
                          } ${!ex.isAvailable ? styles.executorDisabled : ''}`}
                          onClick={() => {
                            setSelectedExecutor(ex);
                            setExecutorDropdownOpen(false);
                          }}
                        >
                          <div className={styles.executorMain}>
                            <div className={styles.executorName}>
                              {ex.name} <span className={styles.executorRole}>{ex.role}</span>
                            </div>
                            <div className={styles.executorRating}>
                              <IonIcon icon={star} /> {ex.rating.toFixed(1)}
                            </div>
                          </div>
                          <div className={styles.executorMeta}>
                            <div
                              className={`${styles.workloadBadge} ${getWorkloadClass(
                                ex.currentWorkload
                              )}`}
                            >
                              Загрузка: {getWorkloadText(ex.currentWorkload)}
                            </div>
                            <div className={ex.isAvailable ? styles.available : styles.unavailable}>
                              {ex.isAvailable ? 'Доступен' : 'Занят'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 3. ПРИОРИТЕТ */}
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>
                <IonIcon icon={flagOutline} className={styles.labelIcon}/>
                Приоритет
              </label>
              <div className={styles.priorityOptions}>
                {['low', 'normal', 'high'].map((p) => (
                  <label key={p} className={styles.priorityOption}>
                    <input type="radio" name="priority" value={p} checked={priority === p} onChange={e => setPriority(e.target.value)} />
                    <div className={`${styles.priorityLabel} ${priority === p ? styles[`p-${p}`] : ''}`}>
                       {p === 'low' ? 'Низкий' : p === 'normal' ? 'Обычный' : 'Высокий'}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. КОММЕНТАРИЙ */}
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>
                <IonIcon icon={chatbubbleOutline} className={styles.labelIcon}/>
                Комментарий
              </label>
              <textarea
                className={styles.commentTextarea}
                placeholder="Укажите детали..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={onClose} className={styles.cancelButton}>Отмена</button>
              <button type="submit" className={styles.submitButton} disabled={!selectedExecutor || isSubmitting}>
                {isSubmitting ? <IonSpinner name="crescent" color="light" style={{width:20}}/> : <IonIcon icon={saveOutline}/>}
                Сохранить
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};