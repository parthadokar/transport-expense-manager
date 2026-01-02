import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

export async function getTasks() {
    try {
        const response = await axios.get(`${BASE_URL}/tasks`)
        return response.data
    } catch(error) {
        console.error('Error Fetching tasks',error)
        throw error
    }
}

export async function postTask(taskData) {
    try {
        const response = await axios.post(`${BASE_URL}/task`,taskData)
        return response.data
    } catch (error) {
        console.error('Error Pushing Task',error)
        throw error
    }
}

export async function updateTask(id,taskData) {
    try {
        const response = await axios.patch(`${BASE_URL}/task/${id}`)
        return response.data
    } catch (error) {
        console.error('Error Updating Task',error)
        throw error
    }
}

export async function deleteTask(id) {
    try {
        await axios.delete(`${BASE_URL}/tasks/{id}`)
    } catch (error) {
        console.error('Error Deleting Task',error)
        throw error
    }
}