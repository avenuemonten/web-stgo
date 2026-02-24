import React, { useMemo, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonTextarea,
  IonListHeader,
  IonSpinner,
  IonChip
} from '@ionic/react';
import { 
  closeOutline, 
  searchOutline, 
  locationOutline,
  personOutline,
  callOutline,
  briefcaseOutline,
  flagOutline,
  folderOpenOutline,
  documentTextOutline,
  star,
  addCircleOutline,
  constructOutline,
  statsChartOutline
} from 'ionicons/icons';

import { post } from '../../../Store/api';
import { useToken } from '../../../Store/loginStore';
import { useToast } from '../../Toast';

import FindLics from '../../Lics/components/FindLic/FindLics';
import { AddressForm } from '../../Lics/components/FindAddress/FindAddress';

import './CreateInvoiceModal.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workers: any[];
  onCreated: () => void;
};

// Хелперы для статусов (адаптировано под статусы создания заявки)
const getStatusColor = (st: string) => {
  switch(st) {
    case 'В работе': return 'warning'; 
    case 'Новый':    return 'primary';
    case 'Черновик': return 'medium';
    default:         return 'primary';
  }
};

const getStatusIcon = (st: string) => {
  switch (st) {
    case 'Новый':    return addCircleOutline;
    case 'В работе': return constructOutline;
    case 'Черновик': return documentTextOutline;
    default:         return statsChartOutline;
  }
};

export default function CreateInvoiceModal({ isOpen, onClose, workers, onCreated }: Props) {
  const toast = useToast();
  const { token } = useToken();

  const [loading, setLoading] = useState(false);
  const [searchingLic, setSearchingLic] = useState(false);

  const [pickLicOpen, setPickLicOpen] = useState(false);
  const [pickAddrOpen, setPickAddrOpen] = useState(false);

  const [licCodeInput, setLicCodeInput] = useState('');

  const [lic, setLic] = useState<{ id: string; code: string; name: string } | null>(null);
  const [applicant, setApplicant] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<string>('');
  
  // Стейты формы
  const [executorId, setExecutorId] = useState<string>('');
  const [status, setStatus] = useState<string>('Черновик');
  const [serviceText, setServiceText] = useState<string>('Выезд на ТО');

  // СТЕЙТЫ ДЛЯ КАСТОМНЫХ СПИСКОВ (КАК В InvExecute)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [executorDropdownOpen, setExecutorDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterWorkload, setFilterWorkload] = useState<'all' | 'low' | 'high'>('all');
  const [filterRating, setFilterRating] = useState<boolean>(false);

  // Форматируем работников как в InvExecute
  const executors = useMemo(() => {
    return workers.map((worker: any) => ({
      id: worker.id || Math.random().toString(),
      name: worker.name || 'Неизвестный',
      role: worker.role || 'Специалист',
      rating: worker.rating || 5.0,
      currentWorkload: worker.currentWorkload || 0,
      isAvailable: worker.isAvailable !== false,
      originalWorker: worker // Сохраняем оригинал для отправки на сервер
    }));
  }, [workers]);

  const selectedExecutor = useMemo(() => {
    return executors.find(ex => ex.id === executorId);
  }, [executorId, executors]);

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

  const getWorkloadText = (workload: number) => {
    if (workload < 3) return 'Низкая';
    if (workload < 6) return 'Средняя';
    return 'Высокая';
  };

  const getWorkloadClass = (workload: number) => {
    if (workload < 3) return 'workloadLow';
    if (workload < 6) return 'workloadMedium';
    return 'workloadHigh';
  };

  const reset = () => {
    setLicCodeInput('');
    setLic(null);
    setApplicant('');
    setPhone('');
    setAddress('');
    setExecutorId('');
    setStatus('Черновик');
    setServiceText('Выезд на ТО');
    setExecutorDropdownOpen(false);
    setStatusDropdownOpen(false);
    setSearchText('');
    setFilterWorkload('all');
    setFilterRating(false);
  };

  const closeAll = () => {
    setPickLicOpen(false);
    setPickAddrOpen(false);
    setLoading(false);
    onClose();
  };

  const handleSearchLic = async () => {
    const code = licCodeInput.trim();
    if (!code) return toast.warning('Введите номер лицевого счета');
    if (!token) return toast.error('Нет токена авторизации');

    setSearchingLic(true);
    try {
      const res = await post('get_lic', { token, code });
      const data = res?.data || res;

      if (data && res?.error !== true && (data.name || data.address)) {
        setApplicant(data.name || data.applicant || '');
        setAddress(data.address || '');
        setLic({ id: data.id ? String(data.id) : code, code: code, name: data.name || data.applicant || '' });
        toast.success('Данные успешно загружены');
      } else {
        toast.error(res?.message || 'Лицевой счет не найден');
        setLic(null);
      }
    } catch (e) {
      toast.error('Ошибка сети при поиске ЛС');
      setLic(null);
    } finally {
      setSearchingLic(false);
    }
  };

  const hydrateFromLics = async (licId: string, licCode: string) => {
    if (!token) return;
    const res = await post('get_lics', { token });
    const list = (res && res.error === false && Array.isArray(res.data)) ? res.data : [];

    const found =
      list.find((x: any) => String(x.id) === String(licId)) ||
      list.find((x: any) => String(x.code) === String(licCode));

    if (found) {
      setApplicant(found.name || '');
      setAddress(found.address || '');
    }
  };

  const handlePickLic = async (licItem: any) => {
    if (!token) return toast.error('Нет token — перелогинься');
    if (licItem?.type !== 'lics') return;

    const licId = String(licItem.id || '');
    const licCode = String(licItem.name || '');
    if (!licId || !licCode) return toast.error('Не удалось прочитать ЛС');

    setLicCodeInput(licCode); 
    setLic({ id: licId, code: licCode, name: '' });

    await post('add_lic', { token, lc: licCode, id: licId });
    await new Promise((r) => setTimeout(r, 700));
    await hydrateFromLics(licId, licCode);

    setPickLicOpen(false);
  };

  const handleCreate = async () => {
    if (!token) return toast.error('Нет token — перелогинься');
    if (!lic?.id) return toast.warning('Найдите лицевой счет');
    if (!address.trim()) return toast.warning('Не указан адрес');
    if (!applicant.trim()) return toast.warning('Не указан заявитель');
    if (!serviceText.trim()) return toast.warning('Заполните описание работ');

    const id = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : String(Date.now());

    // Берем оригинальный объект воркера
    const workerObj = selectedExecutor ? selectedExecutor.originalWorker : null;

    const payload: any = {
      token,
      id,
      applicant,
      phone,
      address: { address },
      lat: 0,
      lon: 0,
      lic: { id: lic.id, code: lic.code, name: applicant },
      service: [serviceText.trim()], 
      status,
      plan_date: new Date().toISOString(),
      worker: workerObj
        ? { id: workerObj.id, name: workerObj.name || '', role: workerObj.role || '' }
        : { id: '', name: '', role: '' }
    };

    setLoading(true);
    try {
      const res = await post('set_invoice', payload);

      if (res?.success) {
        toast.success(res?.message || 'Данные успешно сохранены');
        reset();
        closeAll();
        onCreated();
      } else {
        toast.error(res?.message || 'Ошибка создания');
      }
    } catch (e) {
      toast.error('Ошибка сети при создании');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={closeAll}
      cssClass="stgo-modal create-invoice-modal"
    >
      <IonHeader className="ion-no-border">
        <IonToolbar className="create-invoice-modal__toolbar">
          <IonTitle className="create-invoice-modal__title">Новая заявка</IonTitle>
          <IonButtons slot="end">
            <IonButton className="close-btn" fill="clear" onClick={closeAll}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent color="light">
        <div className="create-invoice-modal__container">
          
          {/* Секция 1: Данные объекта */}
          <div className="form-section">
            <IonListHeader className="form-section-header">
              <IonLabel>Данные объекта</IonLabel>
            </IonListHeader>

            <IonItem className="modern-input-item" lines="none">
              <div slot="start" className="iconBox bgPurple">
                <IonIcon icon={folderOpenOutline} />
              </div>
              <IonLabel position="stacked">Лицевой счет</IonLabel>
              <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                <IonInput 
                  value={licCodeInput} 
                  onIonInput={(e) => setLicCodeInput(e.detail.value || '')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchLic()}
                  placeholder="Введите ЛС и нажмите Enter" 
                  className="modern-input"
                  disabled={searchingLic}
                />
                <button 
                  className="search-action-btn" 
                  onClick={handleSearchLic}
                  disabled={searchingLic}
                  title="Найти данные"
                >
                  {searchingLic ? <IonSpinner name="dots" color="primary" /> : <IonIcon icon={searchOutline} />}
                </button>
              </div>
            </IonItem>

            <IonItem 
              className="modern-input-item clickable-item" 
              lines="none" 
              button 
              detail={false}
              onClick={() => setPickLicOpen(true)}
            >
              <div slot="start" className="iconBox bgRed">
                <IonIcon icon={locationOutline} />
              </div>
              <IonLabel position="stacked">Адрес (нажмите для поиска ЛС)</IonLabel>
              <IonInput 
                value={address} 
                readonly 
                placeholder="Не знаете ЛС? Нажмите сюда" 
                className="modern-input"
                style={{ pointerEvents: 'none' }}
              />
              <IonIcon icon={searchOutline} slot="end" className="action-icon" />
            </IonItem>

            <IonItem className="modern-input-item" lines="none">
              <div slot="start" className="iconBox bgBlue">
                <IonIcon icon={personOutline} />
              </div>
              <IonLabel position="stacked">Заявитель</IonLabel>
              <IonInput 
                value={applicant} 
                readonly 
                placeholder="Заполнится автоматически" 
                className="modern-input"
              />
            </IonItem>

            <IonItem className="modern-input-item" lines="none">
              <div slot="start" className="iconBox bgGreen">
                <IonIcon icon={callOutline} />
              </div>
              <IonLabel position="stacked">Телефон</IonLabel>
              <IonInput
                value={phone}
                onIonInput={(e) => setPhone(e.detail.value || '')}
                placeholder="Ввод вручную"
                className="modern-input"
                type="tel"
              />
            </IonItem>
          </div>

          {/* Секция 2: Детали исполнения */}
          <div className="form-section">
            <IonListHeader className="form-section-header">
              <IonLabel>Детали заявки</IonLabel>
            </IonListHeader>

            <IonItem className="modern-input-item" lines="none">
              <div slot="start" className="iconBox bgOrange">
                <IonIcon icon={documentTextOutline} />
              </div>
              <IonLabel position="stacked">Описание работ</IonLabel>
              <IonTextarea
                value={serviceText}
                onIonInput={(e) => setServiceText(e.detail.value || '')}
                autoGrow
                placeholder="Например: Выезд на ТО"
                className="modern-input modern-textarea"
              />
            </IonItem>

            {/* === СТАТУС (КАК В InvExecute) === */}
            <div className="custom-field-container">
              <button
                type="button"
                className="statusRow"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              >
                <div className="iconBox bgBlue" style={{marginRight: 12, marginTop: 0}}><IonIcon icon={flagOutline} /></div>
                <span className="statusLabel">Статус заявки</span>
                <IonChip outline={false} color={getStatusColor(status)} className="statusCurrentChip">
                  <IonIcon icon={getStatusIcon(status)} />
                  <span style={{ marginLeft: 4 }}>{status}</span>
                </IonChip>
              </button>
              
              {statusDropdownOpen && (
                <div className="statusOptions">
                  {['Черновик', 'Новый', 'В работе'].map((st) => (
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

            {/* === ИСПОЛНИТЕЛЬ (КАК В InvExecute) === */}
            <div className="custom-field-container">
              <div className="sectionLabelHeader">
                <div className="iconBox bgDark" style={{width: 36, height: 36, fontSize: 18, marginRight: 10}}><IonIcon icon={briefcaseOutline} /></div>
                Исполнитель
              </div>

              <div className="executorCard" onClick={() => setExecutorDropdownOpen(!executorDropdownOpen)}>
                {selectedExecutor ? (
                  <>
                    <div className="executorMain">
                      <div className="executorName">
                        {selectedExecutor.name} <span className="executorRole">{selectedExecutor.role}</span>
                      </div>
                      <div className="executorRating">
                        <IonIcon icon={star} /> {selectedExecutor.rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="executorMeta">
                      <div className={`workloadBadge ${getWorkloadClass(selectedExecutor.currentWorkload)}`}>
                        Загрузка: {getWorkloadText(selectedExecutor.currentWorkload)}
                      </div>
                      <div className={selectedExecutor.isAvailable ? 'available' : 'unavailable'}>
                        {selectedExecutor.isAvailable ? 'Доступен' : 'Занят'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="executorPlaceholderText">— не назначать —</div>
                )}
              </div>

              {executorDropdownOpen && (
                <div className="executorDropdownContent">
                  <div className="searchContainer">
                    <IonIcon icon={searchOutline} className="searchIcon" />
                    <input
                      type="text"
                      className="searchInput"
                      placeholder="Поиск сотрудника..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>

                  <div className="filtersContainer">
                    <button
                      type="button"
                      className={`filterChip ${filterWorkload === 'all' && !filterRating ? 'filterChipActive' : ''}`}
                      onClick={() => { setFilterWorkload('all'); setFilterRating(false); }}
                    >
                      Все
                    </button>
                    <button
                      type="button"
                      className={`filterChip ${filterWorkload === 'low' ? 'filterChipActive' : ''}`}
                      onClick={() => setFilterWorkload(filterWorkload === 'low' ? 'all' : 'low')}
                    >
                      Мало задач
                    </button>
                    <button
                      type="button"
                      className={`filterChip ${filterRating ? 'filterChipActive' : ''}`}
                      onClick={() => setFilterRating(!filterRating)}
                    >
                      Высокий рейтинг
                    </button>
                  </div>

                  <div className="executorsList">
                    {/* Кнопка сброса исполнителя */}
                    <div 
                      className={`executorCard ${!selectedExecutor ? 'executorSelected' : ''}`}
                      onClick={() => { setExecutorId(''); setExecutorDropdownOpen(false); }}
                    >
                      <div className="executorPlaceholderText" style={{margin: '8px 0'}}>— не назначать —</div>
                    </div>

                    {filteredExecutors.length === 0 ? (
                      <div className="emptyState">Нет сотрудников по запросу</div>
                    ) : (
                      filteredExecutors.map((ex) => (
                        <div
                          key={ex.id}
                          className={`executorCard ${
                            selectedExecutor?.id === ex.id ? 'executorSelected' : ''
                          } ${!ex.isAvailable ? 'executorDisabled' : ''}`}
                          onClick={() => {
                            setExecutorId(ex.id);
                            setExecutorDropdownOpen(false);
                          }}
                        >
                          <div className="executorMain">
                            <div className="executorName">
                              {ex.name} <span className="executorRole">{ex.role}</span>
                            </div>
                            <div className="executorRating">
                              <IonIcon icon={star} /> {ex.rating.toFixed(1)}
                            </div>
                          </div>
                          <div className="executorMeta">
                            <div className={`workloadBadge ${getWorkloadClass(ex.currentWorkload)}`}>
                              Загрузка: {getWorkloadText(ex.currentWorkload)}
                            </div>
                            <div className={ex.isAvailable ? 'available' : 'unavailable'}>
                              {ex.isAvailable ? 'Доступен' : 'Занят'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </IonContent>

      <IonFooter className="ion-no-border create-invoice-modal__footer">
        <IonToolbar>
          <div className="footer-buttons">
            <button 
              className="action-btn cancel-btn"
              onClick={() => { reset(); closeAll(); }} 
              disabled={loading}
            >
              ОТМЕНА
            </button>
            <button 
              className="action-btn submit-btn"
              onClick={handleCreate} 
              disabled={loading}
            >
              {loading ? 'СОЗДАЮ…' : 'СОЗДАТЬ'}
            </button>
          </div>
        </IonToolbar>
      </IonFooter>

      <FindLics
        isOpen={pickLicOpen}
        onClose={() => setPickLicOpen(false)}
        onSelect={handlePickLic}
      />

      <IonModal
        isOpen={pickAddrOpen}
        onDidDismiss={() => setPickAddrOpen(false)}
        cssClass="stgo-modal"
      >
        <AddressForm
          initialAddress={address}
          onAddressChange={(addr: string) => {
            setAddress(addr);
            setPickAddrOpen(false);
          }}
          onClose={() => setPickAddrOpen(false)}
        />
      </IonModal>
    </IonModal>
  );
}