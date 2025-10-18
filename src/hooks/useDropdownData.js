import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/constants'
import axios from 'axios'

// Create axios instance for dropdown API calls
const dropdownAPI = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const useDropdownData = () => {
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [genders, setGenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingStates, setLoadingStates] = useState(false)
  const [error, setError] = useState(null)

  // Fetch initial dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch countries and genders in parallel
        const [countriesRes, gendersRes] = await Promise.allSettled([
          dropdownAPI.get('/dropdown/countries'),
          dropdownAPI.get('/dropdown/genders')
        ])

        // Handle countries
        if (countriesRes.status === 'fulfilled') {
          setCountries(countriesRes.value.data)
        } else {
          console.error('Failed to fetch countries:', countriesRes.reason)
          setError('Failed to load countries')
        }

        // Handle genders
        if (gendersRes.status === 'fulfilled') {
          setGenders(gendersRes.value.data)
        } else {
          console.error('Failed to fetch genders:', gendersRes.reason)
          setError('Failed to load gender options')
        }

      } catch (err) {
        console.error('Error fetching dropdown data:', err)
        setError('Failed to load dropdown data')
      } finally {
        setLoading(false)
      }
    }

    fetchDropdownData()
  }, [])

  // Function to fetch states for a country
  const fetchStates = async (countryCode) => {
    if (!countryCode || countryCode.length !== 2) {
      setStates([])
      return
    }

    try {
      setLoadingStates(true)
      const response = await dropdownAPI.get(`/dropdown/states?country=${countryCode.toUpperCase()}`)
      setStates(response.data)
    } catch (err) {
      console.error('Error fetching states:', err)
      setStates([])
      setError('Failed to load states for selected country')
    } finally {
      setLoadingStates(false)
    }
  }

  return {
    countries,
    states,
    genders,
    loading,
    loadingStates,
    error,
    fetchStates
  }
}