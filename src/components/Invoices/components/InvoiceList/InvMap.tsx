import React, { useCallback } from 'react'; 
import { 
    IonButton, 
    IonText 
} from '@ionic/react'; 
import styles from './InvoiceList.module.css'; 
import InvoiceItem from './InvoiceItem'; 
import InvWorker from './InvWorker';
import Maps from '../../../Maps/Maps';
import { useWorkers } from '../../../../Store/navigationStore';

export const InvMap: React.FC<any> = ({ 
    invoices, 
    loading, 
    refreshing, 
    onRefresh, 
    onInvoiceSelect, 
    getInvoiceStatus, 
    formatDate, 
    formatPhone
}) => { 

    const handleCall = useCallback((phone: string, event: React.MouseEvent) => { 
        event.stopPropagation(); 
        if (phone) { 
            window.open(`tel:${phone}`); 
        } 
    }, []); 

    const { workers } = useWorkers();

    const render = (invoices: any) => { 
        let elem = <></> 
        
        for(let i = 0; i < invoices.length; i++){ 
            const invoice = invoices[i] 
            if(invoice) 
                elem = <> 
                    { elem } 
                    <InvoiceItem 
                        key         = { invoice?.Ссылка } 
                        invoice     = { invoice } 
                        status      = { getInvoiceStatus(invoice) } 
                        onSelect    = { onInvoiceSelect } 
                        onCall      = { handleCall } 
                        formatDate  = { formatDate } 
                        formatPhone = { formatPhone } 
                    /> 
                </> 
        } 
        return elem 
    } 

    const handleTrackWorker = (workerId: string) => {
        // Логика отслеживания работника на карте
        console.log('Tracking worker:', workerId);
    };

    const handleWorkerSelect = (workerId: string) => {
        // Логика выбора работника
        console.log('Selected worker:', workerId);
    };

    const formatDistance = (distance: number) => {
        if (distance < 1) {
            return `${Math.round(distance * 1000)} м`;
        }
        return `${distance.toFixed(1)} км`;
    };

    const renderWorkers = () => {

        if (!workers || workers.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <IonText color="medium">Нет доступных работников</IonText>
                </div>
            );
        }

        return (
            <div className={styles.workersList}>
                {workers.map((worker: any) => (
                    <InvWorker
                        key                 = { worker.id }
                        worker              = { worker }
                        onSelect            = { handleWorkerSelect }
                        //onCall              = { handleCall }
                        //onTrack             = { handleTrackWorker }
                        // onAssign            = { assignWorker }
                        // onUnassign          = { unassignWorker }
                        //formatDistance      = { formatDistance }
                    />
                ))}
            </div>
        );
    };

    return ( 
        <div className={styles.invoicePageWithMap}> 
            <div className={styles.invoicesPanel}>
                <div className={styles.invoicePageHeader}> 
                    <h2 className={styles.invoicePageTitle}>Зая вки</h2> 
                    <p className={styles.invoicePageSubtitle}>Всего: {invoices.length}</p> 
                </div> 

                <div className={styles.invoicePageContent}> 
                    {loading && !refreshing ? ( 
                        <div className={styles.loadingState}> 
                            <IonText color="medium">Загрузка заявок...</IonText> 
                        </div> 
                    ) : invoices.length === 0 ? ( 
                        <div className={styles.emptyState}> 
                            <IonText color="medium">Нет заявок</IonText> 
                            <IonButton fill="clear" onClick={onRefresh}> 
                                Обновить 
                            </IonButton> 
                        </div> 
                    ) : ( 
                        <div className={styles.invoicesList}> 
                            { render(invoices) } 
                        </div> 
                    )} 
                </div> 
            </div> 

            <div className={styles.mapPanel}>
                <Maps invoices={invoices} />
            </div> 

            <div className={styles.workersPanel}>
                <div className={styles.workersHeader}>
                    <h2 className={styles.workersTitle}>Работники</h2>
                    <p className={styles.workersSubtitle}>Всего: {workers?.length || 0}</p>
                </div>

                <div className={styles.workersContent}>
                    {renderWorkers()}
                </div>
            </div>
        </div> 
    ); 
}; 

export default React.memo(InvMap);