'use client'; // This page involves client-side interactivity and state

import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react'; // Corrected import
import { API_URL } from '../../../config'; // Assuming config.ts is 3 levels up

// Interface for a single AI Configuration item in the list
interface AIConfigItem {
  id: string;
  name: string;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  isActive: boolean; // This will be derived or set based on activeConfigId
}

// Interface for the backend response when fetching all configs
interface AllAIConfigsResponse {
  configurations: AIConfigItem[];
  activeConfigId: string | null;
}

// Interface for POST/PUT responses (individual config)
interface MutateConfigResponse {
  message?: string;
  config?: AIConfigItem; // The newly created or updated config
  allConfigs?: AllAIConfigsResponse; // Sometimes the backend might return all configs
  error?: string;
  activeConfigId?: string; // Added for set-active response
  configurations?: AIConfigItem[]; // Added for set-active response
}

// Form data for adding/editing a configuration
interface ConfigFormData {
  name: string;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
}

const initialNewConfigFormData: ConfigFormData = {
  name: '',
  apiBaseUrl: '',
  apiKey: '',
  modelName: '',
};

export default function AIProviderSettingsPage() {
  const [configurations, setConfigurations] = useState<AIConfigItem[]>([]);
  const [newConfigForm, setNewConfigForm] = useState<ConfigFormData>(initialNewConfigFormData);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null); // For scrolling
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // For specific actions like add, set active
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [configToDelete, setConfigToDelete] = useState<AIConfigItem | null>(null);

  const [isApiKeyVisible, setIsApiKeyVisible] = useState<boolean>(false); // State for API key visibility

  // Fetch all configurations
  const fetchConfigurations = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/ai-configs`);
      if (!response.ok) {
        const errorData: MutateConfigResponse = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: AllAIConfigsResponse = await response.json();
      setConfigurations(data.configurations.map(c => ({ ...c, isActive: c.id === data.activeConfigId })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Failed to fetch AI configurations:', errorMessage);
      setError(errorMessage);
      setConfigurations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const handleFormInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setNewConfigForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    if (!newConfigForm.name || !newConfigForm.apiKey || !newConfigForm.modelName) {
      setError("Name, API Key, and Model Name are required.");
      setIsSubmitting(false);
      return;
    }

    const url = editingConfigId 
      ? `${API_URL}/api/ai-configs/${editingConfigId}` 
      : `${API_URL}/api/ai-configs`;
    const method = editingConfigId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfigForm),
      });
      const result: MutateConfigResponse = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      setSuccessMessage(result.message || `Configuration ${editingConfigId ? 'updated' : 'added'} successfully!`);
      setNewConfigForm(initialNewConfigFormData);
      setEditingConfigId(null);
      await fetchConfigurations(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error(`Failed to ${editingConfigId ? 'update' : 'add'} AI configuration:`, errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActive = async (id: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/ai-configs/${id}/set-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const result: MutateConfigResponse = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      setSuccessMessage(result.message || 'Configuration set to active!');
      await fetchConfigurations(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Failed to set active AI configuration:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (config: AIConfigItem) => {
    setConfigToDelete(config);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setConfigToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDeleteHandler = async () => {
    if (!configToDelete) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/ai-configs/${configToDelete.id}`, {
        method: 'DELETE',
      });
      const result: MutateConfigResponse = await response.json(); 
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      setSuccessMessage(result.message || 'Configuration deleted successfully!');
      await fetchConfigurations(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Failed to delete AI configuration:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal(); // Close modal regardless of outcome
    }
  };

  const handleEdit = (config: AIConfigItem) => {
    setEditingConfigId(config.id);
    setNewConfigForm({
      name: config.name,
      apiBaseUrl: config.apiBaseUrl,
      apiKey: config.apiKey, // Consider not pre-filling API key for security, or use placeholder
      modelName: config.modelName,
    });
    setError(null); // Clear previous errors
    setSuccessMessage(null); // Clear previous success messages
    setIsApiKeyVisible(false); // Reset API key visibility when starting an edit
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingConfigId(null);
    setNewConfigForm(initialNewConfigFormData);
    setError(null);
    setSuccessMessage(null);
    setIsApiKeyVisible(false); // Reset API key visibility on cancel
  };

  const toggleApiKeyVisibility = () => {
    setIsApiKeyVisible(!isApiKeyVisible);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        AI Provider Configurations
      </h1>

      {isLoading && !isSubmitting && <p>Loading configurations...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      <section ref={formRef} style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginTop: '0', marginBottom: '1rem' }}>
          {editingConfigId ? 'Edit Configuration' : 'Add New Configuration'}
        </h2>
        <form onSubmit={handleSubmitForm}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>Configuration Name:</label>
            <input type="text" id="name" name="name" value={newConfigForm.name} onChange={handleFormInputChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} disabled={isSubmitting}/>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="apiBaseUrl" style={{ display: 'block', marginBottom: '0.5rem' }}>API Base URL:</label>
            <input type="text" id="apiBaseUrl" name="apiBaseUrl" value={newConfigForm.apiBaseUrl} onChange={handleFormInputChange} placeholder="e.g., https://api.openai.com/v1" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} disabled={isSubmitting}/>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="apiKey" style={{ display: 'block', marginBottom: '0.5rem' }}>API Key:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type={isApiKeyVisible ? 'text' : 'password'} 
                id="apiKey" 
                name="apiKey" 
                value={newConfigForm.apiKey} 
                onChange={handleFormInputChange} 
                required 
                placeholder={editingConfigId ? "Leave blank to keep current key" : "Enter API Key"} 
                style={{ flexGrow: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} 
                disabled={isSubmitting}
              />
              <button 
                type="button" 
                onClick={toggleApiKeyVisibility} 
                disabled={isSubmitting}
                style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#f0f0f0'}}
                title={isApiKeyVisible ? "Hide API Key" : "Show API Key"}
              >
                <i className={isApiKeyVisible ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </button>
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="modelName" style={{ display: 'block', marginBottom: '0.5rem' }}>Default Model Name:</label>
            <input type="text" id="modelName" name="modelName" value={newConfigForm.modelName} onChange={handleFormInputChange} required placeholder="e.g., gpt-4, deepseek-chat" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} disabled={isSubmitting}/>
          </div>
          <div style={{display: 'flex', gap: '1rem'}}> {/* Wrapper for buttons */}
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', backgroundColor: isSubmitting ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Processing...' : (editingConfigId ? 'Save Changes' : 'Add Configuration')}
            </button>
            {editingConfigId && (
              <button type="button" onClick={cancelEdit} disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Section to Display Existing Configurations */}
      <section>
        <h2 style={{ marginBottom: '1rem' }}>Saved Configurations</h2>
        {configurations.length === 0 && !isLoading && (
          <p>No configurations found. Please add one using the form above.</p>
        )}
        {configurations.length > 0 && (
          <ul style={{ listStyle: 'none', padding: '0', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {configurations.map((config) => (
              <li key={config.id} style={{ width: 'calc(33.333% - 0.75rem)', boxSizing: 'border-box', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: config.isActive ? '#e6f7ff' : '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div> 
                  <h3 style={{ marginTop: '0', marginBottom: '0.5rem', fontSize: '1.1em' }}>
                    {config.name} {config.isActive && <span style={{ fontSize: '0.8em', color: '#096dd9', fontWeight: 'normal' }}>(Active)</span>}
                  </h3>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9em' }}><strong>API URL:</strong> {config.apiBaseUrl || 'Not set'}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9em' }}><strong>Model:</strong> {config.modelName}</p>
                  <p style={{ margin: '0.25rem 0 0.75rem 0', fontSize: '0.9em' }}><strong>API Key:</strong> ********</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}> 
                  {!config.isActive && (
                    <button onClick={() => handleSetActive(config.id)} disabled={isSubmitting} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9em', backgroundColor: isSubmitting ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                      {isSubmitting ? '...' : 'Set Active'}
                    </button>
                  )}
                  <button onClick={() => handleEdit(config)} disabled={isSubmitting} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9em', backgroundColor: isSubmitting ? '#ccc' : '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => openDeleteModal(config)} disabled={isSubmitting || config.isActive} title={config.isActive ? "Cannot delete active configuration" : "Delete configuration"} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9em', backgroundColor: isSubmitting || config.isActive ? '#ccc' : '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting || config.isActive ? 'not-allowed' : 'pointer' }}>
                    {isSubmitting ? '...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && configToDelete && (
        <div style={{
          position: 'fixed', 
          top: '0', 
          left: '0', 
          right: '0', 
          bottom: '0', 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000 // Ensure it's on top
        }}>
          <div style={{
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '8px', 
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{marginTop: 0}}>Confirm Deletion</h3>
            <p>Are you sure you want to delete the configuration "<strong>{configToDelete.name}</strong>"?</p>
            <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
              <button onClick={closeDeleteModal} disabled={isSubmitting} style={{padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer'}}>
                Cancel
              </button>
              <button onClick={confirmDeleteHandler} disabled={isSubmitting} style={{padding: '0.5rem 1rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get the base API URL (if needed outside component, otherwise define inline or in a service file)
// const getApiUrl = () => {
//   return import.meta.env.PROD ? '' : 'http://localhost:3001'; // Adjust port if needed
// }; 