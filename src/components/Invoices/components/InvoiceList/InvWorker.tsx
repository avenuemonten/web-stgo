// InvWorker.tsx
import React from 'react';
import { IonIcon } from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import styles from './InvWorker.module.css';
import { WorkerData } from '../../../../Store/navigationStore';

// Сохраняем интерфейс
export interface WorkerProps {
    worker:         WorkerData;
    isSelected?:    boolean;
    onSelect?:      ( workerId: string ) => void;
}

const InvWorker: React.FC<WorkerProps> = ({ 
    worker, 
    isSelected, 
    onSelect 
}) => {
    
    const getStatusClass = () => {
        if (worker.status === 'available') return styles.available;
        if (worker.status === 'busy') return styles.busy;
        if (worker.status === 'on_break') return styles.on_break;
        return styles.offline;
    };

    return (
        <div 
            className={`${styles.workerCard} ${isSelected ? styles.selected : ''}`}
            onClick={() => onSelect && onSelect(worker.id)}
        >
            <div className={styles.workerAvatar}>
                {worker.avatarUrl ? (
                    <img src={worker.avatarUrl} alt={worker.name} />
                ) : (
                    <IonIcon icon={personCircleOutline} />
                )}
            </div>

            <div className={styles.workerInfo}>
                <span className={styles.workerName}>{'' + worker.name}</span>
                <span className={styles.workerRating}>
                    {worker.in_work > 0 && ('В работе:  ' + worker.in_work + "  /  Законченных: " + worker.completed) }    
                </span>
                <span className={styles.workerRole}>
                    { worker.role || 'Сотрудник' } 
                </span>
            </div>

            <div className={`${styles.statusDot} ${getStatusClass()}`} />
        </div>
    );
};

export default React.memo(InvWorker);