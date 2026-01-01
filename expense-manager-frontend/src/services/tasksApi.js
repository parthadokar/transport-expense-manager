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

// CREATE
// GET
// GET ONE
// DELETE
// UPDATE