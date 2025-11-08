// FIX: Import `React` to be able to use types like `React.Dispatch` and `React.SetStateAction`.
import React, { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Function to read value from localStorage
  const readValue = (): T => {
    // Prevent build errors during server-side rendering
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  };

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    // Prevent build errors during server-side rendering
    if (typeof window == 'undefined') {
      console.warn(
        `Tried setting localStorage key “${key}” even though environment is not a client`,
      );
    }

    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      // FIX: Wrap setItem in a try...catch to handle QuotaExceededError
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        // FIX: Replaced blocking alert with a non-blocking console warning.
        // This prevents the entire UI from freezing when storage is full.
        console.warn(`Error setting localStorage key “${key}”:`, error);
        console.warn("Warning: Could not save project changes. Your browser's local storage might be full. The app will continue to work for this session, but new changes may not be saved permanently.");
      }
    } catch (error) {
      console.warn(`Error setting state for key “${key}”:`, error);
    }
  };
  
  // Listen for changes to this key in other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === key) {
            try {
                if (event.newValue) {
                    setStoredValue(JSON.parse(event.newValue));
                }
            } catch (error) {
                console.warn(`Error parsing storage change for key "${key}":`, error);
            }
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);


  return [storedValue, setValue];
}

export default useLocalStorage;