import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getTasks() {
  return (await axios.get(`${BASE_URL}/tasks`)).data
}

export async function getMonthlySummary() {
  return (await axios.get(`${BASE_URL}/tasks/monthly-summary`)).data
}

export async function postTask(data) {
  return (await axios.post(`${BASE_URL}/tasks`, data)).data
}

export async function updateTask(id, data) {
  return (await axios.patch(`${BASE_URL}/tasks/${id}`, data)).data
}

export async function deleteTask(id) {
  return (await axios.delete(`${BASE_URL}/tasks/${id}`)).data
}
