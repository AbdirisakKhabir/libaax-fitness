'use client';

import { Customer } from '@/types/customer';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function CustomerDetailModal({ isOpen, onClose, customer }: CustomerDetailModalProps) {
  if (!isOpen || !customer) return null;

  const isExpired = new Date(customer.expireDate) < new Date();
  const daysUntilExpiry = Math.ceil(
    (new Date(customer.expireDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getStatusColor = () => {
    if (isExpired) return 'bg-red-500 text-white';
    if (daysUntilExpiry <= 3) return 'bg-orange-500 text-white';
    if (daysUntilExpiry <= 7) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getStatusText = () => {
    if (isExpired) return 'Membership Expired';
    if (daysUntilExpiry === 0) return 'Expires Today';
    if (daysUntilExpiry === 1) return '1 Day Left';
    return `${daysUntilExpiry} Days Left`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMembershipDuration = () => {
    const registered = new Date(customer.registeredDate);
    const now = new Date();
    const months = (now.getFullYear() - registered.getFullYear()) * 12 + (now.getMonth() - registered.getMonth());
    return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : 'New Member';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Member Details</h2>
              <p className="text-blue-100 mt-2">Complete customer information</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {/* Customer Profile */}
          <div className="flex items-center space-x-6 mb-8">
            <img
              src={customer.image || '/api/placeholder/100/100'}
              alt={customer.name}
              className="w-32 h-48 rounded-2xl object-cover border-4 border-gray-200 shadow-lg"
            />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{customer.name}</h3>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="font-medium">{customer.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Member</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${getStatusColor()} mb-6`}>
            <span className="mr-2 text-xl">
              {isExpired ? '🔴' : daysUntilExpiry <= 3 ? '🟠' : daysUntilExpiry <= 7 ? '🟡' : '🟢'}
            </span>
            {getStatusText()}
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Registration Details
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Registration Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(customer.registeredDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Membership Duration</p>
                  <p className="text-lg font-semibold text-blue-600">{getMembershipDuration()}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Expiry Details
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(customer.expireDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`text-lg font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                    {isExpired ? 'Expired' : 'Active'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-blue-50 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Membership Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Member ID</p>
                <p className="font-semibold text-gray-900">{customer.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone Verified</p>
                <p className="font-semibold text-green-600">Yes</p>
              </div>
              <div>
                <p className="text-gray-600">Account Status</p>
                <p className={`font-semibold ${customer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Last Renewal</p>
                <p className="font-semibold text-gray-900">{formatDate(customer.registeredDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold"
            >
              Close
            </button>
            <button
              onClick={() => {
                const message = `Hello ${customer.name}, your gym membership expires on ${formatDate(customer.expireDate)}. Please renew to continue enjoying our services!`;
                const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
            >
              <span>💬</span>
              <span>Send WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}