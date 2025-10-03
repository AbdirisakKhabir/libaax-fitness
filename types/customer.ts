export interface Customer {
    id: string;
    name: string;
    phone: string;
    image: string;
    registeredDate: string;
    expireDate: string;
    isActive: boolean;
  }
  
  export interface RenewalRequest {
    customerIds: string[];
    verificationCode: string;
  }