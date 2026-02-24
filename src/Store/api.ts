
const url = '/mi/'

export interface TResponse {
  success:          boolean;
  data:             any;
  message:         string;
}

export const EMPTY_USER: TResponse = {
    success:        false,
    data:           {},
    message:       "Ошибка в клиенте"
}

export async function post(method: string, params:any) {
    try {
        const response = await fetch( url + method, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify( params )
        });
                
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка:', error);
        return { success: false, message: 'Ошибка сети' };
    }
}

export async function getData(method: string, params:any) {
    try {
        const response = await fetch( 'https://fhd.aostng.ru/inter_vesta/hs/API_STNG/V2/' + method, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify( params )
        });
                
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка:', error);
        return { success: false, message: 'Ошибка сети' };
    }
}

export const formatSum      = (sum: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(sum);
};