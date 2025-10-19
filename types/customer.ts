export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  image: string;
  registerDate: Date;    
  expireDate: Date | null;
  isActive: boolean;
  fee: number;
  gender: string;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}
  
  
  export interface RenewalRequest {
    customerIds: string[];
    verificationCode: string;
  }