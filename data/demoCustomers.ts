import { Customer } from '@/types/customer';

const getDateString = (daysFromToday: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
};

export const demoCustomers: Customer[] = [
  {
    id: '1',
    name: 'Abdihafid Soomaali Cige',
    phone: '063443226',
    image: './abdihafid.jpeg',
    registeredDate: "09-02-2025",
    expireDate: "10-02-2025",
    isActive: false
  },
  {
    id: '2',
    name: 'Abdirisak Abokor Farah',
    phone: '0634366063',
    image: './abdirisak.jpeg',
    registeredDate: "09-02-2025",
    expireDate: "10-02-2025",
    isActive: true
  },
  {
    id: '3',
    name: 'Abdiwakil Mohamed Isse',
    phone: '0637319098',
    image: './abdiwakil.jpeg',
    registeredDate: "09-13-2025",
    expireDate: "10-13-2025",
    isActive: true
  },
  {
    id: '4',
    name: 'Ahmed Mohamed Yusuf',
    phone: '0637319098',
    image: './ahmed_mohamed.jpeg',
    registeredDate: "09-13-2025",
    expireDate: "10-13-2025",
    isActive: true
  },
  {
    id: '5',
    name: 'Ahmed Mohamed Muse',
    phone: '0634304089',
    image: './ahmed.jpeg',
    registeredDate: "09-02-2025",
    expireDate: "10-02-2025",
    isActive: false
  },
  {
    id: '6',
    name: 'Awil Mohamed Hussein',
    phone: '0634300377',
    image: './awil_mohamed.jpeg',
    registeredDate: "09-01-2025",
    expireDate: "10-01-2025",
    isActive: false
  },
  {
    id: '7',
    name: 'Khadar Kayse Abdi',
    phone: '0636725524',
    image: './khadar.jpeg',
    registeredDate: "09-01-2025",
    expireDate: "10-01-2025",
    isActive: false
  },
  {
    id: '8',
    name: 'Mubarik Abdillahi Warsame',
    phone: '0634397751',
    image: './mubaarik.jpeg',
    registeredDate: "09-02-2025",
    expireDate: "10-02-2025",
    isActive: false
  },
  {
    id: '9',
    name: 'Mustafe Saciid Cabdalle',
    phone: '0637319098',
    image: './mustafe.jpeg',
    registeredDate: "09-13-2025",
    expireDate: "10-13-2025",
    isActive: true
  },
  {
    id: '10',
    name: 'Ismail Abdifatah Ismail',
    phone: '0636037470',
    image: './ismail.jpg',
    registeredDate: "08-31-2025",
    expireDate: "09-31-2025",
    isActive: false
  }
];