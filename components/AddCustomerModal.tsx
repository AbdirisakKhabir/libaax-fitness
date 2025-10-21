// components/CustomerModal.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Customer } from '@/types/customer';
import Swal from 'sweetalert2';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (customerId: string, customer: Partial<Customer>) => void;
  customer?: Customer | null;
}

export default function CustomerModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onUpdate, 
  customer 
}: CustomerModalProps) {
  const isEditMode = Boolean(customer);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    registerDate: new Date().toISOString().split('T')[0],
    expireDate: '',
    fee: '',
    gender: 'male',
    image: ''
  });
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes or customer changes
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        // Edit mode - populate form with customer data
        setFormData({
          name: customer.name,
          phone: customer.phone || '',
          registerDate: customer.registerDate ? new Date(customer.registerDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          expireDate: customer.expireDate ? new Date(customer.expireDate).toISOString().split('T')[0] : '',
          fee: customer.fee.toString(),
          gender: customer.gender,
          image: customer.image || ''
        });
        setPreviewImage(customer.image || '');
      } else {
        // Add mode - reset form
        setFormData({
          name: '',
          phone: '',
          registerDate: new Date().toISOString().split('T')[0],
          expireDate: '',
          fee: '',
          gender: 'male',
          image: ''
        });
        setPreviewImage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  }, [isOpen, customer]);

  const validateAndProcessImage = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid file type',
        text: 'Please select an image file (JPEG, PNG, GIF, etc.)',
        timer: 3000,
        showConfirmButton: false,
      });
      return false;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File too large',
        text: 'Please select an image smaller than 5MB',
        timer: 3000,
        showConfirmButton: false,
      });
      return false;
    }

    return true;
  }, []);

  const handleImageProcess = useCallback((file: File) => {
    if (!validateAndProcessImage(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewImage(result);
      setFormData(prev => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  }, [validateAndProcessImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageProcess(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      handleImageProcess(file);
    }
  }, [handleImageProcess]);

  const handleRemoveImage = () => {
    setPreviewImage('');
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      // Validate required fields
      if (!formData.name || !formData.registerDate || !formData.fee || !formData.gender) {
        Swal.fire({
          icon: "error",
          title: "Missing Fields",
          text: "Please fill in all required fields",
          timer: 2000,
          showConfirmButton: false,
        });
        setIsLoading(false);
        return;
      }
  
      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      
      if (formData.phone.trim()) {
        submitFormData.append("phone", formData.phone);
      }
      
      submitFormData.append("registerDate", formData.registerDate);
  
      if (formData.expireDate) {
        submitFormData.append("expireDate", formData.expireDate);
      }
  
      submitFormData.append("fee", formData.fee);
      submitFormData.append("gender", formData.gender);
  
      if (fileInputRef.current?.files?.[0]) {
        submitFormData.append("image", fileInputRef.current.files[0]);
      } else if (formData.image && !formData.image.startsWith('blob:')) {
        // If we have a base64 image from drag & drop, convert it to a file
        const base64Response = await fetch(formData.image);
        const blob = await base64Response.blob();
        const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
        submitFormData.append("image", file);
      }
  
      let response;
      if (isEditMode && customer) {
        // Update existing customer
        response = await fetch(`/api/customer/${customer.id}`, {
          method: "PUT",
          body: submitFormData,
        });
      } else {
        response = await fetch("/api/customer", {
          method: "POST",
          body: submitFormData,
        });
      }
  
      // Check if response is OK first
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }
  
      // Parse the successful response
      let resultCustomer;
      try {
        const responseText = await response.text();
        if (responseText) {
          resultCustomer = JSON.parse(responseText);
        } else {
          throw new Error('Empty response from server');
        }
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Invalid response from server');
      }
  
      console.log('✅ API response:', resultCustomer);
  
      // Call the appropriate callback
      if (isEditMode && customer && onUpdate) {
        console.log('🔄 Calling onUpdate callback');
        onUpdate(customer.id, {
          name: formData.name,
          phone: formData.phone.trim() || null,
          registerDate: new Date(formData.registerDate + "T00:00:00.000Z"),
          expireDate: formData.expireDate ? new Date(formData.expireDate + "T00:00:00.000Z") : null,
          fee: parseFloat(formData.fee),
          gender: formData.gender,
          image: formData.image,
          isActive: customer.isActive,
        });
      } else if (onSave) {
        console.log('💾 Calling onSave callback');
        onSave({
          name: formData.name,
          phone: formData.phone.trim() || null,
          registerDate: new Date(formData.registerDate + "T00:00:00.000Z"),
          expireDate: formData.expireDate ? new Date(formData.expireDate + "T00:00:00.000Z") : null,
          fee: parseFloat(formData.fee),
          gender: formData.gender,
          balance: 0,
          image: formData.image,
          isActive: true,
        });
      }
  
      // WhatsApp notification only for new customers
      if (!isEditMode && formData.phone.trim()) {
        try {
          console.log('📱 Sending WhatsApp notifications');
          // Send welcome message to customer
          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: formData.phone,
              name: formData.name,
              gender: formData.gender,
              fee: formData.fee,
              registerDate: formData.registerDate,
              messageType: 'welcome'
            }),
          });
  
          // Send admin notification
          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: "634363767",
              name: formData.name,
              gender: formData.gender,
              fee: formData.fee,
              registerDate: formData.registerDate,
              messageType: 'admin'
            }),
          });
        } catch (whatsappError) {
          console.error('WhatsApp integration error:', whatsappError);
        }
      }
  
      // Success message
      Swal.fire({
        icon: "success",
        title: `${isEditMode ? 'Customer Updated!' : 'Customer Added!'}`,
        text: `${formData.name} has been successfully ${isEditMode ? 'updated' : 'added'}.`,
        timer: 3000,
        showConfirmButton: false,
      });
  
      onClose();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} customer:`, error);
      Swal.fire({
        icon: "error",
        title: `${isEditMode ? 'Update' : 'Creation'} Failed`,
        text: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} customer. Please try again.`,
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-10 flex items-center justify-center p-4 z-50 backdrop-blur-[1px]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Member' : 'Add New Member'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isEditMode ? 'Update customer details' : 'Enter customer details to create a new membership'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {/* Image Upload Section with Drag & Drop */}
          <div className="text-center">
            <div 
              className={`relative inline-block w-full max-w-xs mx-auto ${
                isDragOver ? 'scale-105' : ''
              } transition-transform duration-200`}
            >
              {/* Drag & Drop Area */}
              <div
                className={`relative w-32 h-32 rounded-2xl border-4 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : previewImage
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                {previewImage ? (
                  <>
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <div className="text-white opacity-0 hover:opacity-100 transition-opacity duration-300 text-center">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium">Change Photo</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    {isDragOver ? (
                      <div className="text-blue-500">
                        <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium">Drop to upload</p>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium">Upload Photo</p>
                        <p className="text-xs mt-1">Click or drag</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Camera Button */}
              {!previewImage && (
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isLoading}
                  className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 hover:scale-110 disabled:opacity-50 z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}

              {/* Remove Button */}
              {previewImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-all duration-200 hover:scale-110 disabled:opacity-50 z-10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isLoading}
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 font-medium">
                Profile Picture
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Click to browse, drag & drop, or use the camera icon. 
                Supports JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg text-gray-900 bg-white placeholder-gray-500 disabled:opacity-50"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Phone Number <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg text-gray-900 bg-white placeholder-gray-500 disabled:opacity-50"
                placeholder="Enter phone number (optional)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {!isEditMode && 'WhatsApp messages will only be sent if phone number is provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Gender *
              </label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg text-gray-900 bg-white disabled:opacity-50"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Registration Date *
              </label>
              <input
                type="date"
                name="registerDate"
                required
                value={formData.registerDate}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg text-gray-900 bg-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Expire Date
              </label>
              <input
                type="date"
                name="expireDate"
                value={formData.expireDate}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg text-gray-900 bg-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Membership Fee *
              </label>
              <input
                type="number"
                name="fee"
                required
                step="0.01"
                min="0"
                value={formData.fee}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg text-gray-900 bg-white placeholder-gray-500 disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:scale-105 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditMode ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEditMode ? 'Update Member' : 'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}