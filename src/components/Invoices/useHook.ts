import { useCallback } from 'react';
import { useInvoices } from '../../Store/invoiceStore'; // Проверь путь
import { useToken, useLoading } from '../../Store/loginStore';
import { useToast } from '../Toast';
import { post } from '../../Store/api';
import { useNavigationStore } from '../../Store/navigationStore';

// Функция для приведения данных от 1С к нормальному виду
const normalizeInvoice = (inv: any) => {
    return {
        ...inv,
        // Если есть id - берем его, иначе Ссылка
        id: inv.id || inv.Ссылка,
        // Если есть address - берем его, иначе Адрес. Если ничего нет - пустой объект
        address: inv.address || inv.Адрес || { address: '', lat: 0, lon: 0 },
        // Остальные поля для совместимости
        status: inv.status || inv.Статус,
        number: inv.number || inv.Номер,
        date: inv.date || inv.Дата,
        applicant: inv.applicant || inv.Контрагент,
        phone: inv.phone || inv.Телефон,
        // Сохраняем и оригинальные русские поля на всякий случай
        Адрес: inv.address || inv.Адрес, 
        Статус: inv.status || inv.Статус
    };
};

export const useHook = () => {
  const { data: invoices, setData, update, setUpdate } = useInvoices();
  const { token } = useToken();
  const toast = useToast();
  const { loading, setLoading } = useLoading();

  const refreshData = useCallback(async ( upd: number ) => {
    // Логируем, чтобы видеть, что происходит
    // console.log('HOOK REFRESH:', { current: update, incoming: upd });

    // ЗАЩИТА ОТ ЦИКЛА: Добавил проверки и зависимости
    if( update < upd ) {
      setLoading(true);
      try {
        const res = await post("invoices", { token });
        
        if (res.success) {
          // === ГЛАВНЫЙ ФИКС: НОРМАЛИЗАЦИЯ ДАННЫХ ===
          // Превращаем русские поля 1С в английские для UI
          const cleanData = res.data.map(normalizeInvoice);
          
          setData(cleanData);
          setUpdate(upd);
          // toast.success("Данные обновлены"); 
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error('Ошибка сети при получении заявок');
      } finally {
        setLoading(false);
      }
    }
  }, [update, token, setData, setUpdate, setLoading, toast]); // <--- ВАЖНО: ЗАВИСИМОСТИ ДОБАВЛЕНЫ

  const get_inv_status = useCallback((invoice: any): any => {
    // Смотрим и на английское, и на русское поле
    const s = invoice.status || invoice.Статус;
    
    if(s === "Новый") return { text: 'Новый', color: 'tertiary' };
    if(s === "В работе") return { text: 'В работе', color: 'primary' };
      
    return { text: s || 'Обычная', color: 'success' };
  }, []);

  const format_date = useCallback((dateString: string): string => {
        if (!dateString || typeof dateString !== 'string') return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return 'Сегодня, ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            } else if (diffDays === 1) {
                return 'Вчера, ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            } else {
                return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
        } catch (err) {
            return dateString;
        }
  }, []);

  const format_phone = useCallback((phone: string): string => {
        if (!phone || typeof phone !== 'string') return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 11 && digits.startsWith('7')) {
            return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
        } 
        return phone;
  }, []);

  const uppdate_address = useCallback(async( id: string, address: any) => {
      // console.log("UPDATING ADDR:", id, address);
      
      // Поддержка и объекта, и строки
      const addrVal = typeof address === 'string' ? address : (address.address || address.value);
      const lat = address.lat || 0;
      const lon = address.lon || 0;

      const res = await post("set_inv_address", { token, id: id, address: addrVal, lat, lon });
      
      if(res.success){
        // === ФИКС ОТОБРАЖЕНИЯ ===
        // Обновляем И 'address' (для UI), И 'Адрес' (для 1С совместимости)
        const jarr = invoices.map( (inv: any) =>
              (inv.id === id || inv.Ссылка === id) 
                ? { 
                    ...inv, 
                    address: addrVal,      // Чтобы UI увидел сразу
                    Адрес: addrVal,        // Чтобы логика 1С не сломалась
                    lat: lat,
                    lon: lon
                  }
                : inv
        );
        setData( jarr );
        toast.success("Адрес сохранен");
      } else {
        toast.error("Ошибка обновления адреса");
      }
      return res;
  }, [ token, invoices, setData, toast ]);

  const upd_worker = useCallback(async( id: string, worker: any ) => {
      const res = await post( "set_inv_worker", { token, id, worker: worker.worker.id, status: worker.status });
      if(res.success){
        let jarr = invoices.map( ( inv: any ) =>
              (inv.id === id || inv.Ссылка === id)
                ? { 
                    ...inv, 
                    worker: worker.worker, // UI
                    Работник: worker.worker, // 1C
                    status: worker.status, // UI
                    Статус: worker.status // 1C
                  }
                : inv
        );
        setData( jarr );

      } else {
        toast.error("Ошибка назначения");
      }
      return res;
  }, [ token, invoices, setData, toast ]);

  return {
    update,
    loading,
    invoices,
    refreshData,
    get_inv_status,
    format_date,
    uppdate_address,
    upd_worker,
    format_phone
  };
};