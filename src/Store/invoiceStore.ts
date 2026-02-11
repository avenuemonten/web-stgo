import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { post } from './api';

interface InvoicesStore {
  update:       number;
  data:         any[];
  setData:      (invoices: any[]) => void;
  setUpdate:    (upd: number) => void;
  updateItem:   ( updates: Partial<any>) => void;
  // Экшн для назначения
  assignWorker: (token: string, invoiceId: string, workerObj: any) => Promise<any>;
}

export const useInvoicesStore = create<InvoicesStore>()(
  devtools(
    (set, get) => ({
      update: 1,
      data:   [],

      setData:   (invoices) => set({ data: invoices }),
      setUpdate: (upd)      => set({ update: upd }),

      updateItem: ( updates ) => {
        const currentData = get().data;
        const newData = currentData.map((inv: any) => {
          if (inv.id === updates.id || inv.Ссылка === updates.id) {
            return { ...inv, ...updates };
          }
          return inv;
        });
        set({ data: newData });
      },

      // === ГЛАВНАЯ ФУНКЦИЯ ===
      // Мы принимаем сюда сразу ОБЪЕКТ сотрудника {id, name}, чтобы обновить UI
      assignWorker: async (token, invoiceId, workerObj) => {
        try {
            // 1. Отправляем на сервер только ID
            const res = await post('set_inv_worker', { token, id: invoiceId, worker: workerObj.id });
            
            if (res.success) {
                // 2. МГНОВЕННО обновляем глобальный список заявок
                const currentData = get().data;
                const newData = currentData.map((inv: any) => {
                    // Ищем нужную заявку по ID (или Ссылке)
                    if (inv.id === invoiceId || inv.Ссылка === invoiceId) {
                        return { 
                            ...inv, 
                            worker: workerObj, // Вставляем объект мастера
                            status: 'В работе', // Меняем статус
                            Статус: 'В работе'  // Дублируем для 1С
                        };
                    }
                    return inv;
                });
                
                // 3. Записываем в стейт -> Карта и Список перерисуются сами
                set({ data: newData }); 
                return res;
            } else {
                return res;
            }
        } catch (e) {
            console.error(e);
            return { success: false, message: 'Ошибка сети' };
        }
      }
    }),
    { name: 'invoices-store' }
  )
);

export const useInvoices = () => {
  const update       = useInvoicesStore((state) => state.update);
  const data         = useInvoicesStore((state) => state.data);
  const setData      = useInvoicesStore((state) => state.setData);
  const setUpdate    = useInvoicesStore((state) => state.setUpdate);
  const updateItem   = useInvoicesStore((state) => state.updateItem);
  const assignWorker = useInvoicesStore((state) => state.assignWorker); // Экспортируем функцию
  return { data, setData, update, setUpdate, updateItem, assignWorker };
};