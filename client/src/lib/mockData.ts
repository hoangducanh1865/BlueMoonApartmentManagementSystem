import { Fee, Household, RequestTicket, Role, StatData, Transaction, User, ResidentMember, ApartmentStatus, ApartmentType } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'admin@bluemoon.com',
    fullName: 'Quản Trị Viên',
    role: Role.ADMIN,
    avatar: 'https://picsum.photos/200'
  },
  {
    id: 'u2',
    email: 'h.anh@gmail.com',
    fullName: 'Phạm Đức Anh',
    role: Role.RESIDENT,
    householdId: 'h1',
    avatar: 'https://picsum.photos/201'
  }
];

export const MOCK_HOUSEHOLDS: Household[] = [
  {
    id: 'h1',
    roomNumber: '1204',
    ownerName: 'Nguyễn Văn A',
    area: 75.5,
    memberCount: 4,
    phoneNumber: '0912.13.23.12',
    building: 'A1',
    status: ApartmentStatus.OCCUPIED,
    type: ApartmentType.NORMAL
  },
  {
    id: 'h2',
    roomNumber: '0802',
    ownerName: 'Trần Thị B',
    area: 90.0,
    memberCount: 3,
    phoneNumber: '0988.77.66.55',
    building: 'B2',
    status: ApartmentStatus.OCCUPIED,
    type: ApartmentType.NORMAL
  },
  {
    id: 'h3',
    roomNumber: '1501',
    ownerName: 'Lê Văn C',
    area: 60.0,
    memberCount: 2,
    phoneNumber: '0911.22.33.44',
    building: 'A1',
    status: ApartmentStatus.OCCUPIED,
    type: ApartmentType.OFFICE
  }
];

export const MOCK_MEMBERS: ResidentMember[] = [
  { id: 'm1', householdId: 'h1', fullName: 'Nguyễn Văn A', dateOfBirth: '1980-01-01', relationToOwner: 'Chủ hộ', cccd: '001080000001', residentCode: '12345', phoneNumber: '0912123123' },
  { id: 'm2', householdId: 'h1', fullName: 'Nguyễn Thị V', dateOfBirth: '1982-05-10', relationToOwner: 'Vợ/Chồng', cccd: '001082000002', residentCode: '12346', phoneNumber: '0912123124' },
  { id: 'm3', householdId: 'h1', fullName: 'Nguyễn Văn Con', dateOfBirth: '2010-08-15', relationToOwner: 'Con', residentCode: '12347', phoneNumber: '0912123125' },
  { id: 'm4', householdId: 'h1', fullName: 'Nguyễn Thị Bé', dateOfBirth: '2015-02-20', relationToOwner: 'Con', residentCode: '12348', phoneNumber: '0912123126' },
  { id: 'm5', householdId: 'h2', fullName: 'Trần Thị B', dateOfBirth: '1985-03-03', relationToOwner: 'Chủ hộ', residentCode: '20001', phoneNumber: '0988776655' },
  { id: 'm6', householdId: 'h2', fullName: 'Lê Văn D', dateOfBirth: '1983-11-11', relationToOwner: 'Vợ/Chồng', residentCode: '20002', phoneNumber: '0988776656' },
  { id: 'm7', householdId: 'h2', fullName: 'Lê Thị E', dateOfBirth: '2012-12-12', relationToOwner: 'Con', residentCode: '20003', phoneNumber: '0988776657' },
];

export const MOCK_FEES: Fee[] = [
  {
    id: 'f1',
    name: 'Phí dịch vụ T10/2025',
    amount: 500000,
    deadline: '2025-10-30',
    status: 'PENDING',
    householdId: 'h1',
    month: '10/2025'
  },
  {
    id: 'f2',
    name: 'Tiền điện T10/2025',
    amount: 1200000,
    deadline: '2025-10-25',
    status: 'PAID',
    householdId: 'h1',
    month: '10/2025'
  },
  {
    id: 'f3',
    name: 'Tiền nước T10/2025',
    amount: 150000,
    deadline: '2025-10-25',
    status: 'PENDING',
    householdId: 'h1',
    month: '10/2025'
  },
  {
    id: 'f4',
    name: 'Phí gửi xe T10/2025',
    amount: 2200000,
    deadline: '2025-10-30',
    status: 'PENDING',
    householdId: 'h2',
    month: '10/2025'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX987654321',
    feeId: 'f2',
    feeName: 'Tiền điện T10/2025',
    amount: 1200000,
    date: '2025-10-20 14:30:00',
    method: 'VNPAY',
    status: 'SUCCESS'
  }
];

export const MOCK_REQUESTS: RequestTicket[] = [
  {
    id: 'r1',
    title: 'Sửa thông tin nhân khẩu',
    description: 'Nhà tôi mới có thêm thành viên, xin cập nhật số nhân khẩu lên 5.',
    status: 'PENDING',
    householdId: 'h1',
    createdAt: '2025-10-21',
    changes: [
      { key: 'memberCount', label: 'Số nhân khẩu', oldValue: 4, newValue: 5 }
    ]
  },
  {
    id: 'r2',
    title: 'Sai diện tích căn hộ',
    description: 'Diện tích trên sổ đỏ là 92m2, trên app ghi 90m2.',
    status: 'PENDING',
    householdId: 'h2',
    createdAt: '2025-10-22',
    changes: [
      { key: 'area', label: 'Diện tích (m2)', oldValue: 90.0, newValue: 92.0 }
    ]
  },
  {
    id: 'r3',
    title: 'Sửa tên chủ hộ',
    description: 'Tên tôi bị sai chính tả.',
    status: 'APPROVED',
    householdId: 'h3',
    createdAt: '2025-10-15',
    changes: [
      { key: 'ownerName', label: 'Chủ hộ', oldValue: 'Lê Văn C', newValue: 'Lê Văn Chính' }
    ]
  }
];

export const MOCK_STATS: StatData[] = [
  { month: 'T7/2025', revenue: 120000000, debt: 15000000 },
  { month: 'T8/2025', revenue: 135000000, debt: 10000000 },
  { month: 'T9/2025', revenue: 110000000, debt: 25000000 },
  { month: 'T10/2025', revenue: 90000000, debt: 45000000 },
];