import { useState, useRef } from 'react';
import { Customer } from '@/types/customer';
import Swal from 'sweetalert2';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (customer: Omit<Customer, 'id' | 'expireDate' | 'isActive'>) => void;
}

export default function AddCustomerModal({ isOpen, onClose, onAdd }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    registeredDate: new Date().toISOString().split('T')[0],
    image: '/api/placeholder/100/100'
  });
  const [previewImage, setPreviewImage] = useState<string>('/api/placeholder/100/100');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        Swal.fire({
          icon: 'error',
          title: 'File too large',
          text: 'Please select an image smaller than 5MB',
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid file type',
          text: 'Please select an image file',
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage('/api/placeholder/100/100');
    setFormData(prev => ({ ...prev, image: '/api/placeholder/100/100' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone && formData.registeredDate) {
      onAdd(formData);
      setFormData({
        name: '',
        phone: '',
        registeredDate: new Date().toISOString().split('T')[0],
        image: '/api/placeholder/100/100'
      });
      setPreviewImage('/api/placeholder/100/100');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
          <h2 className="text-3xl font-bold">Add New Member</h2>
          <p className="text-blue-100 mt-2">Enter customer details to create a new membership</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {/* Image Upload Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-2xl border-4 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Remove Button */}
              {previewImage !== '/api/placeholder/100/100' && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <p className="text-sm text-gray-500 mt-4">
              Click the camera icon to upload a profile picture
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Full Name *
              </label>
             
                <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg text-gray-900 bg-white placeholder-gray-500"
                placeholder="Enter customer name"
                />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg text-gray-900 bg-white placeholder-gray-500"
                placeholder="Enter phone number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Registration Date *
              </label>
              <input
                type="date"
                required
                value={formData.registeredDate}
                onChange={(e) => setFormData({ ...formData, registeredDate: e.target.value })}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg text-gray-900 bg-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold hover:scale-105 shadow-lg"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}