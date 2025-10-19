import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Calendar, DollarSign, User, Users } from 'lucide-react';

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenew: (renewalData: {
    customerIds: string[];
    paidAmounts: { [key: string]: number };
    expireDates: { [key: string]: string };
  }) => void;
  selectedCount: number;
  selectedCustomers: any[];
  currentUser: any; // Add current user info
}

export default function RenewalModal({ 
  isOpen, 
  onClose, 
  onRenew, 
  selectedCount, 
  selectedCustomers,
  currentUser 
}: RenewalModalProps) {
  const [paidAmounts, setPaidAmounts] = useState<{ [key: string]: number }>({});
  const [expireDates, setExpireDates] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default values when modal opens
  useEffect(() => {
    if (isOpen && selectedCustomers.length > 0) {
      const defaultAmounts: { [key: string]: number } = {};
      const defaultDates: { [key: string]: string } = {};

      selectedCustomers.forEach(customer => {
        // Set default paid amount to customer's fee
        defaultAmounts[customer.id] = customer.fee || 0;
        
        // Set default expire date to 1 month from now
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 1);
        defaultDates[customer.id] = defaultDate.toISOString().split('T')[0];
      });

      setPaidAmounts(defaultAmounts);
      setExpireDates(defaultDates);
    }
  }, [isOpen, selectedCustomers]);

  const handlePaidAmountChange = (customerId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setPaidAmounts(prev => ({
      ...prev,
      [customerId]: numAmount
    }));
  };

  const handleExpireDateChange = (customerId: string, date: string) => {
    setExpireDates(prev => ({
      ...prev,
      [customerId]: date
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    for (const customer of selectedCustomers) {
      if (!paidAmounts[customer.id] || paidAmounts[customer.id] <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Amount',
          text: `Please enter a valid paid amount for ${customer.name}`,
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      if (!expireDates[customer.id]) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Date',
          text: `Please select an expire date for ${customer.name}`,
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      // Validate expire date is in the future
      const expireDate = new Date(expireDates[customer.id]);
      if (expireDate <= new Date()) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Date',
          text: `Expire date must be in the future for ${customer.name}`,
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onRenew({
        customerIds: selectedCustomers.map(c => c.id),
        paidAmounts,
        expireDates
      });
    } catch (error) {
      console.error('Error in renewal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="p-2 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Renew Memberships</h2>
              <p className="text-green-100 mt-1">
                Renew {selectedCount} selected customer(s)
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white hover:text-green-200 transition-colors duration-200 p-2 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
          {/* Customer List with Inputs */}
          <div className="p-6 space-y-6">
            {selectedCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-green-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <p className="text-sm text-gray-500">
                        {customer.phone || 'No phone number'} • Fee: ${customer.fee}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      customer.isActive && new Date(customer.expireDate) >= new Date()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.isActive && new Date(customer.expireDate) >= new Date()
                        ? 'Active'
                        : 'Expired'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {new Date(customer.expireDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Paid Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      Paid Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={paidAmounts[customer.id] || ''}
                        onChange={(e) => handlePaidAmountChange(customer.id, e.target.value)}
                        disabled={isSubmitting}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black focus:border-green-500 bg-white transition-all duration-200 disabled:opacity-50"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Standard fee: ${customer.fee}
                    </p>
                  </div>

                  {/* Expire Date Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      New Expire Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={expireDates[customer.id] || ''}
                      onChange={(e) => handleExpireDateChange(customer.id, e.target.value)}
                      disabled={isSubmitting}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black bg-white transition-all duration-200 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be in the future
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary and Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-600">Total Customers</p>
                    <p className="text-xl font-bold text-gray-800">{selectedCount}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-green-600">
                      ${Object.values(paidAmounts).reduce((sum, amount) => sum + (amount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 lg:flex-none px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Renew All ({selectedCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}