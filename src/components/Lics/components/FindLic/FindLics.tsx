import React, { useState, useCallback, useMemo } from 'react';
import { IonModal, IonLoading, IonIcon } from '@ionic/react';
import { closeOutline, searchOutline, locationOutline } from 'ionicons/icons';
import { useLics } from './useFindLics';
import './FindLics.css';
import DropdownFilter from './DropDownFilter';

interface LicsFormProps {
    address?: string;
    invoiceId?: string;
    onSelect: ( lic: any ) => void;
    isOpen: boolean;
    onClose: () => void;
}

const FindLics: React.FC<LicsFormProps> = ({ 
    address,
    onSelect, 
    isOpen, 
    onClose 
}) => {
    const { 
        uluses, settlements, streets, houses, kv, lics, loading,
        loadSettlements, loadStreets, loadHouses, loadKv, loadLics 
    } = useLics();

    const [ info, setInfo ] = useState('Выберите улус или город')

    const handleSelect = useCallback((item: any) => {
        switch (item.type) {
            case "ulus": 
                setInfo( item.name )
                loadSettlements(item.items);
                break;
            case "settle":
                setInfo( info + ' → ' + item.name )
                loadStreets(item.id);
                break;
            case "street":
                setInfo( info + ' → ' + item.name )
                loadHouses(item.id);
                break;
            case "house":
                setInfo( info + ' → ' + item.name )
                loadLics(item.items);
                break;
            case "build":
                setInfo( info + ' → ' + item.name )
                loadKv(item.items);
                break;
            case "kv":
                setInfo( info + ' → ' + item.name )
                loadLics(item.items);
                break;
            case "lics":
                onSelect( item )
                break;
        }
    }, [loadSettlements, loadStreets, loadHouses, loadKv, loadLics, info, onSelect]);

    const levelConfig = useMemo(() => {
        const config: any = [];

        if (uluses.length > 0) {
            config.push({
                type: 'ulus', label: 'Район / Улус',
                render: () => <DropdownFilter options={uluses} onSelect={handleSelect} />
            });
        }
        if (settlements.length > 0) {
            config.push({
                type: 'settle', label: 'Населенный пункт',
                render: () => <DropdownFilter options={settlements} onSelect={handleSelect} />
            });
        }
        if (streets.length > 0) {
            config.push({
                type: 'street', label: 'Улица',
                render: () => <DropdownFilter options={streets} onSelect={handleSelect} />
            });
        }
        if (houses.length > 0) {
            config.push({
                type: 'house', label: 'Дом',
                render: () => <DropdownFilter options={houses} onSelect={handleSelect} />
            });
        }
        if (kv.length > 0) {
            config.push({
                type: 'kv', label: 'Квартира',
                render: () => <DropdownFilter options={kv} onSelect={handleSelect} />
            });
        }
        if (lics.length > 0) {
            config.push({
                type: 'lics', label: 'Лицевой счет',
                render: () => <DropdownFilter options={lics} onSelect={handleSelect} />
            });
        }
        return config;
    }, [uluses, settlements, streets, houses, kv, lics, handleSelect]);

    return (
        <>
            <IonLoading isOpen={loading} message="Загрузка данных..." />
            
            <IonModal 
                isOpen={isOpen} 
                onDidDismiss={onClose}
                className="lics-form-modal"
            >
                {/* ШАПКА */}
                <div className="find-lics-header">
                    <div>
                        <div className="find-lics-title">
                            <IonIcon icon={searchOutline} />
                            <span className='ml-05'>Поиск лицевого счета</span>
                        </div>
                        <div className='ml-2'>
                            { address}
                        </div>

                    </div>
                    <button onClick={onClose} className="close-btn">
                        <IonIcon icon={closeOutline} />
                    </button>
                </div>
                
                {/* КОНТЕНТ */}
                <div className="find-lics-content">
                    {/* Хлебные крошки */}
                    <div className="info-crumb-box">
                        <IonIcon icon={locationOutline} className="info-crumb-icon"/>
                        <span>{info}</span>
                    </div>

                    {/* Список уровней */}
                    {levelConfig.map((config, index) => (
                        <div key={`${config.type}-${index}`} className="lics-level-container">
                            <label className="lics-level-label">
                                {config.label}
                            </label>
                            {config.render()}
                        </div>
                    ))}
                </div>
            </IonModal>
        </>
    );
};

export default React.memo( FindLics );