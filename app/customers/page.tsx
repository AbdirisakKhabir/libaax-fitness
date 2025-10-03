'use client';

import { useState, useEffect, useMemo } from 'react';
import { Customer } from '@/types/customer';
import { demoCustomers } from '@/data/demoCustomers';
import CustomerCard from '@/components/CustomerCard';
import AddCustomerModal from '@/components/AddCustomerModal';
import RenewalModal from '@/components/RenewalModal';
import CustomerDetailModal from '@/components/CustomerDetailModal';
import Swal from 'sweetalert2';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCustomers(demoCustomers);
    setFilteredCustomers(demoCustomers);
  }, []);

  const stats = useMemo(() => {
    if (!isClient) return { total: 0, active: 0, expired: 0, expiringThisWeek: 0 };
    
    const total = customers.length;
    const active = customers.filter(c => c.isActive && new Date(c.expireDate) >= new Date()).length;
    const expired = customers.filter(c => !c.isActive || new Date(c.expireDate) < new Date()).length;
    const expiringThisWeek = customers.filter(c => {
      const expireDate = new Date(c.expireDate);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return expireDate >= today && expireDate <= nextWeek;
    }).length;

    return { total, active, expired, expiringThisWeek };
  }, [customers, isClient]);

  const getDayName = (daysFromToday: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getDateString = (daysFromToday: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString().split('T')[0];
  };

  const filterCustomers = (filter: string) => {
    setSelectedFilter(filter);
    
    let filtered = customers;

    if (filter !== 'all') {
      let targetDate: string;
      switch (filter) {
        case 'today':
          targetDate = getDateString(0);
          break;
        case 'tomorrow':
          targetDate = getDateString(1);
          break;
        case 'dayAfterTomorrow':
          targetDate = getDateString(2);
          break;
        case 'expired':
          filtered = filtered.filter(customer => 
            !customer.isActive || new Date(customer.expireDate) < new Date()
          );
          break;
        default:
          targetDate = filter;
      }

      if (filter !== 'expired') {
        filtered = filtered.filter(customer => 
          customer.expireDate === targetDate
        );
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    let filtered = customers;

    if (selectedFilter !== 'all') {
      let targetDate: string;
      switch (selectedFilter) {
        case 'today':
          targetDate = getDateString(0);
          break;
        case 'tomorrow':
          targetDate = getDateString(1);
          break;
        case 'dayAfterTomorrow':
          targetDate = getDateString(2);
          break;
        case 'expired':
          filtered = filtered.filter(customer => 
            !customer.isActive || new Date(customer.expireDate) < new Date()
          );
          break;
        default:
          targetDate = selectedFilter;
      }

      if (selectedFilter !== 'expired') {
        filtered = filtered.filter(customer => 
          customer.expireDate === targetDate
        );
      }
    }

    if (term) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(term.toLowerCase()) ||
        customer.phone.toLowerCase().includes(term.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = (newCustomer: Omit<Customer, 'id' | 'expireDate' | 'isActive'>) => {
    const registeredDate = new Date(newCustomer.registeredDate);
    const expireDate = new Date(registeredDate);
    expireDate.setMonth(expireDate.getMonth() + 1);

    const customer: Customer = {
      ...newCustomer,
      id: Date.now().toString(),
      expireDate: expireDate.toISOString().split('T')[0],
      isActive: true
    };

    setCustomers(prev => [...prev, customer]);
    setFilteredCustomers(prev => [...prev, customer]);
    setIsAddModalOpen(false);
    
    Swal.fire({
      icon: 'success',
      title: 'Customer Added!',
      text: `${newCustomer.name} has been successfully added.`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleRenewal = (verificationCode: string) => {
    if (verificationCode === '123456') {
      const updatedCustomers = customers.map(customer => {
        if (selectedCustomers.includes(customer.id)) {
          const newExpireDate = new Date();
          newExpireDate.setMonth(newExpireDate.getMonth() + 1);
          return {
            ...customer,
            expireDate: newExpireDate.toISOString().split('T')[0],
            isActive: true
          };
        }
        return customer;
      });

      setCustomers(updatedCustomers);
      setFilteredCustomers(updatedCustomers);
      setSelectedCustomers([]);
      setIsRenewalModalOpen(false);

      Swal.fire({
        icon: 'success',
        title: 'Renewal Successful!',
        text: `${selectedCustomers.length} customer(s) have been renewed for 1 month.`,
        timer: 3000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Code',
        text: 'Please enter the correct verification code.',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleWhatsAppMessage = () => {
    if (selectedCustomers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Customers Selected',
        text: 'Please select at least one customer to send WhatsApp message.',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const selectedCustomersData = customers.filter(c => selectedCustomers.includes(c.id));
    
    // For multiple customers, we'll send individual messages
    selectedCustomersData.forEach(customer => {
      const message = `Hello ${customer.name}, your gym membership expires on ${new Date(customer.expireDate).toLocaleDateString()}. Please renew to continue enjoying our services! 🏋️‍♂️`;
      const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    });

    Swal.fire({
      icon: 'success',
      title: 'WhatsApp Messages Sent!',
      text: `Initiated messages for ${selectedCustomers.length} customer(s).`,
      timer: 3000,
      showConfirmButton: false,
    });
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-12"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-2xl p-6 h-24"></div>
              ))}
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 mb-8 h-40"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex px-10 mb-12">
        <img
              src='./logo.jpg'
              alt="Company Logo"
              className="w-22 h-22 rounded-xl object-cover border-2 border-gray-200"
            />
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Libaax Fitness Membership Management</h1>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Members</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold mt-2">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Expired</p>
                <p className="text-3xl font-bold mt-2">{stats.expired}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Expiring Soon</p>
                <p className="text-3xl font-bold mt-2">{stats.expiringThisWeek}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-gray-50 rounded-2xl shadow-sm p-8 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg> */}
              </div>
              <input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => filterCustomers('all')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedFilter === 'all'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                All Members
              </button>
              <button
                onClick={() => filterCustomers('today')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedFilter === 'today'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                Today ({getDayName(0)})
              </button>
              <button
                onClick={() => filterCustomers('tomorrow')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedFilter === 'tomorrow'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                Tomorrow ({getDayName(1)})
              </button>
              <button
                onClick={() => filterCustomers('expired')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedFilter === 'expired'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                Expired Members
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200">
            {selectedCustomers.length > 0 && (
              <>
                <button
                  onClick={() => setIsRenewalModalOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-green-500/25 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Renew Selected ({selectedCustomers.length})</span>
                </button>
                <button
                  onClick={handleWhatsAppMessage}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-green-500/25 flex items-center space-x-2"
                >
                  <span>💬</span>
                  <span>WhatsApp ({selectedCustomers.length})</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Member</span>
            </button>
          </div>
        </div>

        {/* Select All Checkbox */}
        {filteredCustomers.length > 0 && (
          <div className="mb-6 flex items-center bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
            <input
              type="checkbox"
              checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
              onChange={selectAllCustomers}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <label className="ml-3 text-gray-700 font-semibold">
              Select All ({selectedCustomers.length} selected of {filteredCustomers.length})
            </label>
          </div>
        )}

        {/* Customer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCustomers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              isSelected={selectedCustomers.includes(customer.id)}
              onSelect={() => toggleCustomerSelection(customer.id)}
              onClick={handleCustomerClick}
            />
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-gray-400 text-8xl mb-6">💪</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-2">No members found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Get started by adding your first gym member'
              }
            </p>
          </div>
        )}

        {/* Modals */}
        <AddCustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddCustomer}
        />

        <RenewalModal
          isOpen={isRenewalModalOpen}
          onClose={() => setIsRenewalModalOpen(false)}
          onRenew={handleRenewal}
          selectedCount={selectedCustomers.length}
        />

        <CustomerDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          customer={selectedCustomer}
        />
      </div>
    </div>
  );
}