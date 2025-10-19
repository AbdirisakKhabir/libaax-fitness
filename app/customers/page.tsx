'use client';
import { useState, useEffect, useMemo } from 'react';
import { Customer } from '@/types/customer';
import CustomerCard from '@/components/CustomerCard';
import CustomerDetailModal from '@/components/CustomerDetailModal';
import Swal from 'sweetalert2';
import AddCustomerModal from '@/components/AddCustomerModal';
import AddUserModal from '@/components/AddUserModal';
import UsersListModal from '@/components/UsersListModal';
import { Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import PaymentsListModal from '@/components/PaymentsListModal';
import PaymentsReportModal from '@/components/PaymentsReportModal';
import { Search, Plus, RefreshCw, MessageCircle } from "lucide-react";
import RenewalModal from '@/components/RenewalModal';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { CreditCard, BarChart3, LogOut, UserPlus, ChevronRight, ChevronLeft } from 'lucide-react';
import CustomerModal from '@/components/AddCustomerModal';
// Payment types
interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

// Report types
interface ReportFilters {
  startDate: string;
  endDate: string;
  phone: string;
  name: string;
}

// Auth Wrapper Component
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}

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
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isUsersListModalOpen, setIsUsersListModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(12);
  // New state for dropdowns and modals
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isPaymentsListModalOpen, setIsPaymentsListModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isPaymentsReportModalOpen, setIsPaymentsReportModalOpen] = useState(false);
  const [isCustomersReportModalOpen, setIsCustomersReportModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    phone: '',
    name: ''
  });
  const [genderFilter, setGenderFilter] = useState<string>('all');

  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout from Libaax Fitness?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });
  
    if (result.isConfirmed) {
      try {
        // Show loading
        Swal.fire({
          title: 'Logging out...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
  
        await signOut({ redirect: false });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        Swal.close();
        router.push('/login');
        
      } catch (error) {
        console.error('Logout error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Logout Failed',
          text: 'Failed to logout. Please try again.',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  // Function to handle updating a customer
const handleUpdateCustomer = async (customerId: string, updatedData: Partial<Customer>) => {
  try {
    // Update local state
    setCustomers(prev => prev.map(c => 
      c.id === customerId ? { ...c, ...updatedData } : c
    ));
    setFilteredCustomers(prev => prev.map(c => 
      c.id === customerId ? { ...c, ...updatedData } : c
    ));
    
    // If the edited customer is currently selected in detail modal, update it
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(prev => prev ? { ...prev, ...updatedData } : null);
    }
  } catch (error) {
    console.error('Error updating customer:', error);
  }
};

// Update your CustomerDetailModal to include edit functionality
// In your CustomerDetailModal component, add an edit button:



  // Fetch real customers from API
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const realCustomers = await response.json();
        setCustomers(realCustomers);
        setFilteredCustomers(realCustomers);
      } else {
        throw new Error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load customers. Please refresh the page.',
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchCustomers();
  }, []);

  const handleAddUser = (userData: any) => {
    setUsers(prev => [...prev, userData]);
    setIsAddUserModalOpen(false);
  };

  // Add missing function definitions
  const handleReportFilterChange = (key: keyof ReportFilters, value: string) => {
    setReportFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generateReport = (type: 'payments' | 'customers') => {
    console.log(`Generating ${type} report with filters:`, reportFilters);
    Swal.fire({
      icon: 'info',
      title: 'Report Generation',
      text: `${type} report generation feature will be implemented soon.`,
      timer: 3000,
      showConfirmButton: false,
    });
  };

  const handleAddPayment = (paymentData: any) => {
    console.log('Adding payment:', paymentData);
    setIsAddPaymentModalOpen(false);
  };

  const stats = useMemo(() => {
    if (!isClient) return { total: 0, active: 0, expired: 0, expiringThisWeek: 0, male: 0, female: 0 };
    
    const total = customers.length;
    
    // Handle null expireDate safely
    const active = customers.filter(c => {
      if (!c.expireDate) return false; // If no expire date, consider as inactive
      return c.isActive && new Date(c.expireDate) >= new Date();
    }).length;
    
    const expired = customers.filter(c => {
      if (!c.expireDate) return true; // If no expire date, consider as expired
      return !c.isActive || new Date(c.expireDate) < new Date();
    }).length;
    
    const expiringThisWeek = customers.filter(c => {
      if (!c.expireDate) return false; // If no expire date, skip
      
      const expireDate = new Date(c.expireDate);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      return expireDate >= today && expireDate <= nextWeek;
    }).length;
    
    const male = customers.filter(c => c.gender === 'male').length;
    const female = customers.filter(c => c.gender === 'female').length;
  
    return { total, active, expired, expiringThisWeek, male, female };
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
    applyFilters(filter, searchTerm, genderFilter);
  };

  const handleGenderFilter = (gender: string) => {
    setGenderFilter(gender);
    applyFilters(selectedFilter, searchTerm, gender);
  };

  const applyFilters = (filter: string, search: string, gender: string) => {
    let filtered = customers;
  
    // Date filter
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
          filtered = filtered.filter(customer => {
            if (!customer.expireDate) return true; // No expire date = expired
            return !customer.isActive || new Date(customer.expireDate) < new Date();
          });
          break;
        default:
          targetDate = filter;
      }
  
      if (filter !== 'expired') {
        filtered = filtered.filter(customer => {
          if (!customer.expireDate) return false; // No expire date = skip
          const customerDate = new Date(customer.expireDate).toISOString().split('T')[0];
          return customerDate === targetDate;
        });
      }
    }
  
    // Search filter
    if (search) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase()))
      );
    }
  
    // Gender filter
    if (gender !== 'all') {
      filtered = filtered.filter(customer => customer.gender === gender);
    }
  
    setFilteredCustomers(filtered);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(selectedFilter, term, genderFilter);
  };

  const handleAddCustomer = (newCustomer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const customer: Customer = {
      ...newCustomer,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setCustomers(prev => [...prev, customer]);
    setFilteredCustomers(prev => [...prev, customer]);
    
    Swal.fire({
      icon: 'success',
      title: 'Customer Added!',
      text: `${newCustomer.name} has been successfully added.`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleRenewal = async (renewalData: {
    customerIds: string[];
    paidAmounts: { [key: string]: number };
    expireDates: { [key: string]: string };
  }) => {
    try {
      const renewalPromises = renewalData.customerIds.map(async (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return null;
  
        try {
          // Call the renew API endpoint
          const renewResponse = await fetch(`/api/customer/${customerId}/renew`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              expireDate: renewalData.expireDates[customerId],
              paidAmount: renewalData.paidAmounts[customerId],
              userId: 1, // Replace with actual user ID from your auth system
            }),
          });
  
          if (!renewResponse.ok) {
            const errorData = await renewResponse.json();
            throw new Error(errorData.error || 'Failed to renew customer');
          }
  
          const result = await renewResponse.json();
  
          // Send renewal WhatsApp message if phone exists
          if (customer.phone) {
            try {
              await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  phone: customer.phone,
                  name: customer.name,
                  gender: customer.gender,
                  fee: renewalData.paidAmounts[customerId],
                  registerDate: new Date().toISOString().split('T')[0],
                  expireDate: renewalData.expireDates[customerId],
                  messageType: 'renewal'
                }),
              });
              console.log(`Renewal message sent to ${customer.name}`);
            } catch (whatsappError) {
              console.error(`Failed to send renewal message to ${customer.name}:`, whatsappError);
            }
          }
  
          return result.customer;
  
        } catch (error) {
          console.error(`Error renewing customer ${customer.name}:`, error);
          throw error;
        }
      });
  
      const renewalResults = await Promise.allSettled(renewalPromises);
      
      // Check for any failures
      const failedRenewals = renewalResults.filter(result => result.status === 'rejected');
      
      if (failedRenewals.length > 0) {
        throw new Error(`${failedRenewals.length} customer(s) failed to renew`);
      }
  
      // Update local state with successful renewals
      const updatedCustomers = renewalResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value)
        .map(result => result.value);
  
      const newCustomers = customers.map(customer => {
        const updatedCustomer = updatedCustomers.find(uc => uc?.id === customer.id);
        return updatedCustomer || customer;
      });
  
      setCustomers(newCustomers);
      setFilteredCustomers(newCustomers);
      setSelectedCustomers([]);
      setIsRenewalModalOpen(false);
  
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Renewal Successful!',
        html: `
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p class="text-lg font-semibold text-gray-800">${renewalData.customerIds.length} customer(s) renewed!</p>
            <p class="text-gray-600 mt-2">Memberships have been extended successfully.</p>
          </div>
        `,
        confirmButtonText: 'Great!',
        confirmButtonColor: '#10b981',
        timer: 5000,
        timerProgressBar: true,
      });
  
    } catch (error) {
      console.error('Error during renewal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Renewal Failed',
        text: error instanceof Error ? error.message : 'Failed to process renewal. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
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


  const handleWhatsAppMessage = async () => {
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
  
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Send Payment Reminders?',
      html: `
        <div class="text-left">
          <p>You are about to send payment reminder messages to <strong>${selectedCustomers.length}</strong> customer(s).</p>
          <div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p class="text-sm text-yellow-800 font-semibold">Selected Customers:</p>
            <ul class="text-sm text-yellow-700 mt-2 max-h-32 overflow-y-auto">
              ${customers
                .filter(c => selectedCustomers.includes(c.id))
                .map(customer => `<li>• ${customer.name} (${customer.phone})</li>`)
                .join('')}
            </ul>
          </div>
          <p class="mt-3 text-sm text-gray-600">Do you want to proceed?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Send Messages',
      cancelButtonText: 'No, Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'px-6 py-3 rounded-xl font-semibold',
        cancelButton: 'px-6 py-3 rounded-xl font-semibold'
      }
    });
  
    // If user confirms, send messages
    if (result.isConfirmed) {
      try {
        const selectedCustomersData = customers.filter(c => selectedCustomers.includes(c.id));
        let successCount = 0;
        let failCount = 0;
  
        // Show loading state
        Swal.fire({
          title: 'Sending Messages...',
          html: `
            <div class="text-center">
              <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Sending payment reminders to ${selectedCustomers.length} customer(s)...</p>
              <p class="text-sm text-gray-500 mt-2">Please wait</p>
            </div>
          `,
          showConfirmButton: false,
          allowOutsideClick: false
        });
  
        // Send payment reminder to each selected customer
        const messagePromises = selectedCustomersData.map(async (customer) => {
          try {
            const response = await fetch('/api/whatsapp/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phone: customer.phone,
                name: customer.name,
                gender: customer.gender,
                fee: customer.fee,
                registerDate: new Date().toISOString().split('T')[0],
                messageType: 'payment'
              }),
            });
  
            const result = await response.json();
            
            if (result.success) {
              successCount++;
              console.log(`✅ Payment reminder sent to ${customer.name}`);
              return { success: true, customer: customer.name };
            } else {
              failCount++;
              console.error(`❌ Failed to send to ${customer.name}:`, result.error);
              return { success: false, customer: customer.name, error: result.error };
            }
          } catch (whatsappError) {
            failCount++;
            console.error(`❌ Failed to send payment reminder to ${customer.name}:`, whatsappError);
            return { success: false, customer: customer.name, error: whatsappError };
          }
        });
  
        // Wait for all messages to complete
        const results = await Promise.allSettled(messagePromises);
  
        // Close loading dialog
        Swal.close();
  
        // Show results summary
        if (failCount === 0) {
          // All messages sent successfully
          Swal.fire({
            icon: 'success',
            title: 'Messages Sent Successfully!',
            html: `
              <div class="text-center">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p class="text-lg font-semibold text-gray-800">All messages sent successfully!</p>
                <p class="text-gray-600 mt-2">Payment reminders sent to <strong>${successCount}</strong> customer(s).</p>
              </div>
            `,
            confirmButtonText: 'Great!',
            confirmButtonColor: '#10b981',
            timer: 5000,
            timerProgressBar: true,
          });
        } else if (successCount > 0) {
          // Some messages failed
          Swal.fire({
            icon: 'warning',
            title: 'Partial Success',
            html: `
              <div class="text-left">
                <p><strong>${successCount}</strong> message(s) sent successfully</p>
                <p><strong>${failCount}</strong> message(s) failed to send</p>
                <div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p class="text-sm text-yellow-800">Some customers may not have received the payment reminder.</p>
                </div>
              </div>
            `,
            confirmButtonText: 'Understand',
            confirmButtonColor: '#f59e0b',
          });
        } else {
          // All messages failed
          Swal.fire({
            icon: 'error',
            title: 'Failed to Send Messages',
            text: 'All payment reminder messages failed to send. Please try again later.',
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#ef4444',
          });
        }
  
      } catch (error) {
        console.error('Error sending WhatsApp messages:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An unexpected error occurred while sending messages.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
        });
      }
    } else {
      // User cancelled
      Swal.fire({
        icon: 'info',
        title: 'Cancelled',
        text: 'Message sending was cancelled.',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };


  const indexOfLastCustomer = currentPage * customersPerPage;
const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchTerm, genderFilter]);


  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-12"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-24 shadow-sm"></div>
              ))}
            </div>
            
            <div className="bg-white rounded-2xl p-8 mb-8 h-40 shadow-sm"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Navigation Dropdowns */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="flex items-center mb-4 md:mb-0">
              <img
                src='./logo.jpg'
                alt="Company Logo"
                className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-lg mr-4"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Libaax Fitness</h1>
                <p className="text-gray-600 mt-1">Membership Management System</p>
                {session?.user && (
                  <p className="text-sm text-gray-500">
                    Welcome, {session.user.name || session.user.email?.split('@')[0] || 'User'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Navigation Dropdowns */}
            <div className="flex flex-wrap gap-3">
              {/* Payments Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'payments' ? null : 'payments')}
                  className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-300 flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payments</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeDropdown === 'payments' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white text-black rounded-xl shadow-lg border border-gray-200 z-10 animate-in fade-in-0 zoom-in-95">
                    <button
                      onClick={() => {
                        setIsPaymentsListModalOpen(true);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-t-xl transition-colors duration-200 border-b border-gray-100 flex items-center space-x-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Payments List</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Users Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'users' ? null : 'users')}
                  className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:border-green-300 flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeDropdown === 'users' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white text-black rounded-xl shadow-lg border border-gray-200 z-10 animate-in fade-in-0 zoom-in-95">
                    <button
                      onClick={() => {
                        setIsUsersListModalOpen(true);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-t-xl duration-200 border-b border-gray-100 flex items-center space-x-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>Users List</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsAddUserModalOpen(true);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-b-xl transition-colors duration-200 flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add User</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Reports Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'reports' ? null : 'reports')}
                  className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:border-purple-300 flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Reports</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeDropdown === 'reports' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white text-black rounded-xl shadow-lg border border-gray-200 z-10 animate-in fade-in-0 zoom-in-95">
                    <button
                      onClick={() => {
                        setIsPaymentsReportModalOpen(true);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 rounded-t-xl transition-colors duration-200 border-b border-gray-100 flex items-center space-x-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Payments Report</span>
                    </button>
        
                  </div>
                )}
              </div>

              {/* Add Member Button */}
              <div className="relative">
                <button
                 onClick={() => setIsCustomerModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 
                            hover:from-blue-600 hover:to-blue-700 text-white 
                            px-8 py-4 rounded-xl font-bold transition-all duration-200 
                            shadow-lg shadow-blue-500/25 flex items-center space-x-2 
                            transform hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Member</span>
                </button>
              </div>

              {/* Logout Button */}
              <div className="relative">
                <button
                  onClick={handleLogout}
                  className="bg-white text-red-600 border border-red-200 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:bg-red-50 hover:border-red-300 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
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
                  <Users className="w-7 h-7 text-white" />
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
                  <CheckCircle className="w-7 h-7 text-white" />
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
                  <Clock className="w-7 h-7 text-white" />
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
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8 mb-8 border border-gray-200 transition-all duration-300 hover:shadow-xl">
            {/* Top Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or phone number..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                            bg-white shadow-sm text-gray-900 placeholder-gray-500 
                            transition-all duration-200 hover:shadow-md"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
                {[
                  { label: "All Members", key: "all", color: "blue" },
                  { label: `Today (${getDayName(0)})`, key: "today", color: "red" },
                  { label: `Tomorrow (${getDayName(1)})`, key: "tomorrow", color: "orange" },
                  { label: "Expired", key: "expired", color: "red" },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => filterCustomers(btn.key)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      selectedFilter === btn.key
                        ? `bg-${btn.color}-500 text-white shadow-lg shadow-${btn.color}-500/25`
                        : `bg-white text-gray-700 border border-gray-300 hover:border-${btn.color}-300 hover:bg-${btn.color}-50 shadow-sm`
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}

                {/* Gender Filters */}
                {[
                  { label: "Male", key: "male", color: "indigo" },
                  { label: "Female", key: "female", color: "pink" },
                  { label: "All Genders", key: "all", color: "gray" },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => handleGenderFilter(btn.key)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      genderFilter === btn.key
                        ? `bg-${btn.color}-500 text-white shadow-lg shadow-${btn.color}-500/25`
                        : `bg-white text-gray-700 border border-gray-300 hover:border-${btn.color}-300 hover:bg-${btn.color}-50 shadow-sm`
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
              {selectedCustomers.length > 0 && (
                <>
                  {/* Renew Button */}
                  <button
                    onClick={() => setIsRenewalModalOpen(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 
                              hover:from-green-600 hover:to-green-700 text-white 
                              px-6 py-4 rounded-xl font-bold transition-all duration-200 
                              shadow-lg shadow-green-500/25 flex items-center space-x-2 
                              transform hover:scale-105"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Renew Selected ({selectedCustomers.length})</span>
                  </button>

                  {/* WhatsApp Button */}
                  <button
                    onClick={handleWhatsAppMessage}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 
                              hover:from-emerald-600 hover:to-green-700 text-white 
                              px-6 py-4 rounded-xl font-bold transition-all duration-200 
                              shadow-lg shadow-green-500/25 flex items-center space-x-2 
                              transform hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>WhatsApp ({selectedCustomers.length})</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Select All Checkbox */}
          {filteredCustomers.length > 0 && (
            <div className="mb-6 flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-200">
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
            {currentCustomers.map(customer => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                isSelected={selectedCustomers.includes(customer.id)}
                onSelect={() => toggleCustomerSelection(customer.id)}
                onClick={handleCustomerClick}
              />
            ))}
        </div>
          
          {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`w-10 h-10 rounded-lg font-semibold ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}


          {filteredCustomers.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
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
          <CustomerDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            customer={selectedCustomer}
            onEdit={handleEditCustomer}
          />

        
          <CustomerModal
            isOpen={isCustomerModalOpen}
            onClose={() => {
              setIsCustomerModalOpen(false);
              setEditingCustomer(null);
            }}
            onSave={handleAddCustomer}
            onUpdate={handleUpdateCustomer}
            customer={editingCustomer}
          />


          <RenewalModal
            isOpen={isRenewalModalOpen}
            onClose={() => setIsRenewalModalOpen(false)}
            onRenew={handleRenewal}
            selectedCount={selectedCustomers.length}
            selectedCustomers={customers.filter(c => selectedCustomers.includes(c.id))}
            currentUser={session?.user} // Pass current user info
          />

          <CustomerDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            customer={selectedCustomer}
            onEdit={handleEditCustomer}
          />

          <PaymentsListModal
            isOpen={isPaymentsListModalOpen}
            onClose={() => setIsPaymentsListModalOpen(false)}
          />

          {/* Payments Report Modal */}
          <PaymentsReportModal
            isOpen={isPaymentsReportModalOpen}
            onClose={() => setIsPaymentsReportModalOpen(false)}
          />

          {/* Add User Modal */}
          <AddUserModal
            isOpen={isAddUserModalOpen}
            onClose={() => setIsAddUserModalOpen(false)}
            onAdd={handleAddUser}
          />

          {/* Users List Modal */}
          <UsersListModal
            isOpen={isUsersListModalOpen}
            onClose={() => setIsUsersListModalOpen(false)}
          />

          {/* Add Payment Modal */}
          {isAddPaymentModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Add New Payment</h2>
                    <button
                      onClick={() => setIsAddPaymentModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleAddPayment({
                      customerId: formData.get('customerId') as string,
                      customerName: formData.get('customerName') as string,
                      amount: parseFloat(formData.get('amount') as string),
                      paymentDate: formData.get('paymentDate') as string,
                      paymentMethod: formData.get('paymentMethod') as string,
                      notes: formData.get('notes') as string
                    });
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                      <input
                        type="text"
                        name="customerName"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                      <input
                        type="number"
                        name="amount"
                        step="0.01"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                      <input
                        type="date"
                        name="paymentDate"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                      <select
                        name="paymentMethod"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-gray-900"
                      >
                        <option value="">Select Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Mobile Payment">Mobile Payment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        name="notes"
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-gray-900"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsAddPaymentModalOpen(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                      >
                        Add Payment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Customers Report Modal */}
          {isCustomersReportModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Customers Report</h2>
                    <button
                      onClick={() => setIsCustomersReportModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={reportFilters.startDate}
                        onChange={(e) => handleReportFilterChange('startDate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={reportFilters.endDate}
                        onChange={(e) => handleReportFilterChange('endDate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                      <input
                        type="text"
                        value={reportFilters.name}
                        onChange={(e) => handleReportFilterChange('name', e.target.value)}
                        placeholder="Filter by name..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={reportFilters.phone}
                        onChange={(e) => handleReportFilterChange('phone', e.target.value)}
                        placeholder="Filter by phone..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => setIsCustomersReportModalOpen(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => generateReport('customers')}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
}