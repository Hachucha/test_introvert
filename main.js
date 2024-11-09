import nodeFetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const accessToken = process.env.AMO_ACCESS_TOKEN;
const amoUrl = process.env.AMO_URL;

// Функция для создания задачи
async function createTask(contactId) {
    const url = `https://${amoUrl}/api/v4/tasks`;
    
    const taskData = {
        text: "Контакт без сделок",
        complete_till: Math.floor(Date.now() / 1000) + 86400, // Задача на следующий день
        entity_id: contactId,
        entity_type: "contacts",
        task_type_id: 1, // ID типа задачи (проверьте на своей амо-системе)
    };

    try {
        await nodeFetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        console.log(`Задача создана для контакта ${contactId}`);
    } catch (error) {
        console.error(`Ошибка при создании задачи для контакта ${contactId}:`, error);
    }
}

// Функция для получения всех контактов и фильтрации по отсутствию сделок
async function processContactsWithoutDeals() {
    let page = 1;
    const limit = 50;

    try {
        while (true) {
            const url = `https://${amoUrl}/api/v4/contacts?page=${page}&limit=${limit}&with=leads`;
            const response = await nodeFetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            const contacts = response.data._embedded.contacts;
            if (contacts.length === 0) break;

            // Фильтруем контакты без сделок и создаем для них задачи
            for (const contact of contacts) {
                if (contact._embedded.leads.length === 0) {
                    await createTask(contact.id);
                }
            }

            page++;
        }
    } catch (error) {
        console.error('Ошибка при получении контактов:', error.response.data);
    }
}

// Запуск основного процесса
processContactsWithoutDeals();
