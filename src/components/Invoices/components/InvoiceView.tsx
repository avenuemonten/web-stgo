import React, { useCallback, useState, useEffect, useRef } from 'react';
import styles from './InvoiceView.module.css';
import { Invoice } from './InvoiceList/InvoiceItem';
import { IonModal, IonIcon } from '@ionic/react';
import { 
  closeOutline, printOutline, locationOutline, personOutline, 
  callOutline, walletOutline, timeOutline, documentTextOutline, 
  checkmarkCircleOutline, alertCircleOutline, constructOutline, 
  searchOutline, ellipsisHorizontal, chatbubbleEllipsesOutline
} from 'ionicons/icons';
import { AddressForm } from '../../Lics/components/FindAddress/FindAddress'; 
// Импортируем работников из навигации (там они точно есть)
import { useItem, useWorkers } from '../../../Store/navigationStore'; 
// Импортируем логику назначения
import { useInvoices } from '../../../Store/invoiceStore'; 
import { useToken } from '../../../Store/loginStore';
import { formatDate } from '../../Lics/useLics';

interface InvoiceModalProps {
  invoice:            Invoice;
  invoiceStatus:      any;
  formatDate?:        (dateString: string) => string;
  formatPhone?:       (phone: string) => string;
  onNavigateToActs:   () => void;
  onNavigateToPrint:  () => void;
  onUpdateAddress?:   (invoiceId: string, newAddress: any) => void;
  isOpen:             boolean;
  onClose:            () => void;
}

export const InvoiceView: React.FC<InvoiceModalProps> = ({
  invoice,
  formatPhone,
  onNavigateToActs,
  onNavigateToPrint,
  onUpdateAddress,
  isOpen,
  onClose
}) => {
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const { setItem } = useItem();
  
  // Достаем список работников и функцию назначения
  const { workers } = useWorkers();
  const { assignWorker } = useInvoices();
  const { token } = useToken();

  const [localAddress, setLocalAddress] = useState<any>(invoice?.address);
  const currentInvoiceId = useRef(invoice?.id);

  useEffect(() => {
    if (invoice?.id && invoice.id !== currentInvoiceId.current) {
        currentInvoiceId.current = invoice.id;
        setLocalAddress(invoice.address);
        return;
    }
    if (invoice?.address) setLocalAddress(invoice.address);
  }, [invoice?.id, invoice?.address]);

  const safeInvoice = invoice as any;

  // === ОБРАБОТЧИК ВЫБОРА МАСТЕРА ===
  const handleAssignWorker = async (workerId: string) => {
      // 1. Находим объект мастера в списке
      const workerObj = workers.find((w: any) => w.id === workerId);
      if (!workerObj) return;

      console.log("Назначаем:", workerObj.name);

      // 2. Отправляем в стор (он обновит глобальный список и карту)
      const res = await assignWorker(token, safeInvoice.id, workerObj);
      
      if (res.success) {
          // 3. Обновляем текущую открытую карточку
          setItem({ 
              ...safeInvoice, 
              worker: { id: workerObj.id, name: workerObj.name, role: workerObj.role }, 
              status: 'В работе'
          });
      }
  };

  const safeString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') return val.name || val.value || ''; 
    return '';
  };

  const getDisplayAddress = () => {
    const target = localAddress || safeInvoice.address || safeInvoice.Адрес;
    if (!target) return 'Адрес не указан';
    if (typeof target === 'string') return target;
    if (typeof target === 'object') return target.address || target.value || 'Адрес не указан';
    return 'Адрес не указан';
  };

  const getStatusStyle = (status: string) => {
    const s = safeString(status);
    if (s === 'Новый') return styles.statusNew;
    if (s === 'В работе') return styles.statusWork;
    if (s === 'Выполнена') return styles.statusDone;
    return styles.statusFail;
  };

  const getStatusIcon = (status: string) => {
    const s = safeString(status);
    if (s === 'Выполнена') return checkmarkCircleOutline;
    if (s === 'В работе') return constructOutline;
    return alertCircleOutline;
  };

  if (!isOpen || !invoice) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          
          <div className={styles.modalHeader}>
            <div className={styles.modalToolbar}>
              <div style={{flex:1}} className={styles.modalTitle}>Заявка #{safeInvoice.number}</div>
              <div style={{display:'flex', gap:8}}>
                <button className={styles.iconBtn} onClick={onNavigateToPrint}><IonIcon icon={printOutline} /></button>
                <button className={styles.iconBtn} onClick={onClose}><IonIcon icon={closeOutline} /></button>
              </div>
            </div>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.heroSection}>
              <div className={styles.heroInfo}>
                <div className={styles.heroNumber}>#{safeString(safeInvoice.number)}</div>
                <div className={styles.heroDate}>
                  <IonIcon icon={timeOutline} />
                  {formatDate ? formatDate(safeString(safeInvoice.date)) : safeString(safeInvoice.date)}
                </div>
              </div>
              <div className={`${styles.statusBadge} ${getStatusStyle(safeInvoice.status)}`}>
                <IonIcon icon={getStatusIcon(safeInvoice.status)} />
                {safeInvoice.status}
              </div>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.detailCard}>
                <div className={`${styles.iconBox} ${styles.bgRed}`}><IonIcon icon={locationOutline} /></div>
                <div className={styles.contentData}>
                  <div className={styles.label}>Адрес объекта</div>
                  <div className={styles.value}>{getDisplayAddress()}</div>
                </div>
                <div className={styles.actionSlot}>
                   <button className={styles.miniBtn} onClick={() => setIsUpdatingAddress(true)}>
                     <IonIcon icon={searchOutline}/>
                   </button>
                </div>
              </div>

              {safeInvoice.applicant && (
                <div className={styles.detailCard}>
                  <div className={`${styles.iconBox} ${styles.bgBlue}`}><IonIcon icon={personOutline} /></div>
                  <div className={styles.contentData}>
                    <div className={styles.label}>Заявитель</div>
                    <div className={styles.value}>{safeInvoice.applicant}</div>
                  </div>
                </div>
              )}

              {/* === ВЫБОР ИСПОЛНИТЕЛЯ === */}
              <div className={styles.detailCard}>
                  <div className={`${styles.iconBox} ${styles.bgDark}`}><IonIcon icon={constructOutline} /></div>
                  <div className={styles.contentData} style={{width: '100%'}}>
                    <div className={styles.label}>Исполнитель</div>
                    
                    <div>
                        {safeInvoice.worker?.name || ''}
                    </div>

                  </div>
              </div>

              {/* ...остальные блоки... */}
              <div className={styles.detailCard}>
                <div className={`${styles.iconBox} ${styles.bgPurple}`}><IonIcon icon={walletOutline} /></div>
                <div className={styles.contentData}>
                  <div className={styles.label}>Лицевой счет</div>
                  <div className={styles.value}>{safeInvoice.lic?.code || safeInvoice.lic || 'Без Л/С'}</div>
                </div>
              </div>

              {(safeInvoice.service || safeInvoice.complete_text) && (
                <div className={styles.detailCard}>
                  <div className={`${styles.iconBox} ${styles.bgOrange}`}><IonIcon icon={documentTextOutline} /></div>
                  <div className={styles.contentData}>
                    <div className={styles.label}>Описание работ</div>
                    <div className={styles.value} style={{whiteSpace: 'pre-wrap'}}>
                        {safeInvoice.service || safeInvoice.complete_text}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.mainBtn} onClick={onNavigateToActs}>
              <IonIcon icon={chatbubbleEllipsesOutline} />
              Акты / Статус
            </button>
          </div>
        </div>
      </div>

      <IonModal
        isOpen={isUpdatingAddress}
        onDidDismiss={() => setIsUpdatingAddress(false)}
        style={{ '--height': 'auto', '--max-height': '80vh', '--border-radius': '20px', '--width': '100%', '--max-width': '550px' }}
      >
        <AddressForm 
            initialAddress={getDisplayAddress()} 
            onAddressChange={(data: any) => { 
                if (data) {
                    const newItem = { ...safeInvoice, address: data, Адрес: data };
                    setItem(newItem); 
                    if (onUpdateAddress) onUpdateAddress(safeInvoice.id, data);
                }
                setIsUpdatingAddress(false);
            }} 
            onClose={() => setIsUpdatingAddress(false)}
        />
      </IonModal>
    </>
  );
};