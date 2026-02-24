import React, { useMemo, useState, useEffect } from 'react';
import { 
  IonSearchbar, 
  IonSpinner, 
  IonIcon, 
  IonButton 
} from '@ionic/react';
import { filterOutline } from 'ionicons/icons';

import { useHook } from './useHook'; 
import { useItem, useUpdate, useWorkers } from '../../Store/navigationStore'; 

import InvoiceItem from './components/InvoiceList/InvoiceItem'; 
import InvWorker from './components/InvoiceList/InvWorker'; 
import Maps from '../Maps/Maps'; 
import { InvoiceView } from './components/InvoiceView';
import { InvExecute } from './components/InvExecute';

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
  }, []); // Пустой массив = только при монтировании/размонтировании

  // Следим за item
  useEffect(() => {
    // Если в item что-то попало...
    if (item && !view && !exec) {
       // ...проверяем, Заявка ли это? (у заявки есть номер)
       if (item.number) {
           setView(true);
       } else {
           // Если это не заявка (например, мусор из Lics), игнорируем или чистим
           // console.log("Пришел неверный item в Invoices:", item);
       }
    }
  }, [item]);

  const filteredInvoices = useMemo(() => {
    const jarr =  invoices.filter(inv => {
      const search = searchText.toLowerCase();
      return (
        inv.number.toLowerCase().includes(search) 
        || (inv.applicant).toLowerCase().includes(search) 
  //        || inv.status.toLowerCase().includes(search)
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
    // setView(true) вызовется в useEffect выше
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
  const handleUpdateLic = async ( lic: any ) => {
    console.log("onUpdatyLic", lic)
    if (item) {
        console.log("item", item)
        await upd_lic(item.id, lic );
        setUpdate(update + 1);
    }
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
             <IonButton fill="clear" size="small" className="filter-btn">
                <IonIcon slot="icon-only" icon={filterOutline} color="medium" />
             </IonButton>
          </div>
          
          <IonSearchbar 
            value={searchText} 
            onIonInput={e => setSearchText(e.detail.value!)} 
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
            filteredInvoices.map((invoice) => (
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
         <Maps 
            invoices = { filteredInvoices }
            // mapRouteData = {
            //     item && item.number ? { // Проверка item.number
            //         startCoords: [55.751244, 37.618423], 
            //         endCoords: [55.751310, 37.618445], 
            //         licInfo: item.cargoDetails
            //     }
            // } : null }
         />
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

      {/* Модалка ЗАЯВКИ (Фиолетовая) */}
      {/* Проверяем view && item.number, чтобы точно знать, что это заявка */}
      {item && view && item.number && (
        <InvoiceView
            isOpen={view}
            invoice={item}
            invoiceStatus       = { get_inv_status(item) }
            formatDate          = { format_date }
            formatPhone         = { format_phone }
            onUpdateLic         = { handleUpdateLic }
            onNavigateToActs    = { () => { setView(false); setExec(true); } }
            onNavigateToPrint   = { () => {} }
            onUpdateAddress     = { handleUpdateAddress }
            onClose             = { () => { setView(false); setItem(null); } }
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