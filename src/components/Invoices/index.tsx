import React, { useMemo, useState, useEffect } from 'react';
import {
  IonSearchbar,
  IonSpinner,
  IonIcon,
  IonButton
} from '@ionic/react';
import { filterOutline, addOutline } from 'ionicons/icons';

import { useHook } from './useHook';
import { useItem, useUpdate, useWorkers } from '../../Store/navigationStore';

import InvoiceItem from './components/InvoiceList/InvoiceItem';
import InvWorker from './components/InvoiceList/InvWorker';
import Maps from '../Maps/Maps';
import { InvoiceView } from './components/InvoiceView';
import { InvExecute } from './components/InvExecute';

import CreateInvoiceModal from './components/CreateInvoiceModal';

import styles from './components/InvoiceList/InvoiceList.module.css';

const Invoices: React.FC = () => {
  const {
    invoices,
    loading,
    refreshData,
    format_phone,
    format_date,
    uppdate_address,
    upd_worker,
    upd_lic,
    get_inv_status
  } = useHook();

  const { update, setUpdate } = useUpdate();
  const { item, setItem } = useItem();
  const { workers } = useWorkers();

  const [searchText, setSearchText] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const [view, setView] = useState(false);
  const [exec, setExec] = useState(false);

  // модалка создания
  const [createOpen, setCreateOpen] = useState(false);

  // === ГЛАВНЫЙ ФИКС ===
  useEffect(() => {
    // Очистка при входе
    setItem(null);
    setView(false);
    refreshData(update);

    // Очистка при ВЫХОДЕ (чтобы данные не лезли в Lics)
    return () => {
      setItem(null);
    };
  }, []); // только при монтировании/размонтировании

  // Следим за item
  useEffect(() => {
    if (item && !view && !exec) {
      if (item.number) {
        setView(true);
      }
    }
  }, [item]);

  const filteredInvoices = useMemo(() => {
    const jarr = invoices.filter((inv: any) => {
      const search = searchText.toLowerCase();
      return (
        inv.number.toLowerCase().includes(search) ||
        (inv.applicant).toLowerCase().includes(search)
      );
    });

    return jarr;
  }, [invoices, searchText]);

  const sortedWorkers = useMemo(() => {
    return [...workers].sort((a: any, b: any) => {
      if (a.status === 'available' && b.status !== 'available') return -1;
      if (a.status !== 'available' && b.status === 'available') return 1;
      return 0;
    });
  }, [workers]);

  const handleSelectInvoice = (invoice: any) => {
    setItem(invoice);
  };

  const handleUpdateAddress = async (id: string, address: any) => {
    await uppdate_address(id, address);
    setUpdate(update + 1);
  };

  const handleUpdateWorker = async (worker: any) => {
    if (item) {
      await upd_worker(item.id, worker);
      setUpdate(update + 1);
    }
  };

  const handleUpdateLic = async (lic: any) => {
    if (item) {
      await upd_lic(item.id, lic);
      setUpdate(update + 1);
    }
  };

  // ====== ВОТ ЭТО ГЛАВНОЕ, ЧТО ДЕЛАЕТ “ПОЯВЛЯЕТСЯ СЛЕВА” ======
  const forceRefreshInvoices = () => {
    // 1) сбросить поиск, чтобы новый элемент не скрывался фильтром
    setSearchText('');

    // 2) сразу обновить
    setUpdate((u) => {
      const next = u + 1;
      refreshData(next);
      return next;
    });

    // 3) ещё раз через 1 сек (бэк иногда добавляет не мгновенно)
    setTimeout(() => {
      setUpdate((u) => {
        const next = u + 1;
        refreshData(next);
        return next;
      });
    }, 1000);
  };

  return (
    <div className={styles.invoicePageWithMap}>
      <div className={styles.invoicesPanel}>
        <div className={styles.invoicesHeader}>
          <div className={styles.headerTopRow}>
            <h2 className={styles.panelTitle}>
              Заявки
              <span className={styles.countBadge}>{filteredInvoices.length}</span>
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* + */}
              <IonButton
                fill="solid"
                size="small"
                onClick={() => setCreateOpen(true)}
                aria-label="Создать заявку"
              >
                <IonIcon slot="icon-only" icon={addOutline} />
              </IonButton>

              {/* filter */}
              <IonButton fill="clear" size="small" className="filter-btn">
                <IonIcon slot="icon-only" icon={filterOutline} color="medium" />
              </IonButton>
            </div>
          </div>

          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Поиск по номеру..."
            className="custom-searchbar"
          />
        </div>

        <div className={styles.invoicesContent}>
          {loading ? (
            <div className={styles.loadingState}>
              <IonSpinner name="crescent" />
            </div>
          ) : filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice: any) => (
              <InvoiceItem
                key={invoice.id}
                invoice={invoice}
                status={get_inv_status(invoice)}
                onSelect={handleSelectInvoice}
                onCall={() => {}}
                formatDate={format_date}
                formatPhone={format_phone}
                isSelected={item?.id === invoice.id}
              />
            ))
          ) : (
            <div className={styles.emptyState}>Список пуст</div>
          )}
        </div>
      </div>

      <div className={styles.mapPanel}>
        <Maps invoices={filteredInvoices} />
      </div>

      <div className={styles.workersPanel}>
        <div className={styles.workersHeader}>
          <h2 className={styles.panelTitle}>
            Сотрудники
            <span className={styles.countBadge}>{workers.length}</span>
          </h2>
        </div>

        <div className={styles.workersContent}>
          {sortedWorkers.map((worker: any) => (
            <InvWorker
              key={worker.id}
              worker={worker}
              isSelected={selectedWorkerId === worker.id}
              onSelect={(id) => setSelectedWorkerId(id)}
            />
          ))}
        </div>
      </div>

      {/* Модалка СОЗДАНИЯ */}
      <CreateInvoiceModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        workers={workers}
        onCreated={() => {
          setCreateOpen(false);
          forceRefreshInvoices();
        }}
      />

      {/* Модалка ЗАЯВКИ */}
      {item && view && item.number && (
        <InvoiceView
          isOpen={view}
          invoice={item}
          invoiceStatus={get_inv_status(item)}
          formatDate={format_date}
          formatPhone={format_phone}
          onUpdateLic={handleUpdateLic}
          onNavigateToActs={() => {
            setView(false);
            setExec(true);
          }}
          onNavigateToPrint={() => {}}
          onUpdateAddress={handleUpdateAddress}
          onClose={() => {
            setView(false);
            setItem(null);
          }}
        />
      )}

      {item && exec && (
        <InvExecute
          invoice={item}
          isOpen={exec}
          onClose={() => setExec(false)}
          onAssignToExecutor={handleUpdateWorker}
        />
      )}
    </div>
  );
};

export default Invoices;