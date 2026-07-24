import React, { useEffect, useState } from 'react';
import { User, Household, Invoice } from '@/src/lib/types';
import { getHouseholdById } from '../../../lib/householdService';
import { getInvoices } from '../../../lib/invoiceService';
import { CreditCard, Home, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResidentDashboardProps {
  user: User;
}

const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user }) => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const pendingInvoices = invoices.filter(inv => inv.status === 'unpaid');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const totalDebt = pendingInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.householdId) {
          const [householdData, invoicesData] = await Promise.all([
            getHouseholdById(user.householdId),
            getInvoices(0, 100) // Get first 100 invoices for resident
          ]);
          setHousehold(householdData);
          setInvoices(invoicesData.content);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.householdId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Xin chào, {user.fullName}</h1>
        <p className="text-gray-500 text-sm mt-1 md:mt-0">Hôm nay là {new Date().toLocaleDateString('vi-VN')}</p>
      </div>

      {/* Household Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Thông tin căn hộ</h2>
            <p className="text-gray-500 text-sm">
              {household?.building ? `Tòa ${household.building} - ` : ''}
              Phòng {household?.roomNumber || 'N/A'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">Chủ hộ</p>
            <p className="font-medium text-gray-900">{household?.ownerName || 'Chưa cập nhật'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">Tòa nhà</p>
            <p className="font-medium text-gray-900">{household?.building || '---'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">Diện tích</p>
            <p className="font-medium text-gray-900">{household?.area ? `${household.area} m²` : '...'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">Nhân khẩu</p>
            <p className="font-medium text-gray-900">{household?.memberCount || 0} người</p>
          </div>
        </div>
      </div>

      {/* Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-100 font-medium mb-1">Tổng dư nợ</p>
              <h3 className="text-3xl font-bold">{formatCurrency(totalDebt)}</h3>
            </div>
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="mt-4 text-sm text-red-100">
            Bạn có {pendingInvoices.length} hóa đơn chưa thanh toán
          </p>
          <div className="mt-6">
            <Link
              to="/list/fees"
              className="block w-full text-center py-2 bg-white text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              Thanh toán ngay
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <CreditCard className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Giao dịch gần đây</h3>
            </div>
            {paidInvoices.slice(0, 3).map(invoice => (
              <div key={invoice.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{invoice.title}</p>
                  <p className="text-xs text-gray-500">Tháng {invoice.month}/{invoice.year}</p>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            ))}
            {paidInvoices.length === 0 && (
              <p className="text-sm text-gray-400 italic">Chưa có giao dịch nào.</p>
            )}
          </div>
          <Link to="/list/history" className="text-sm text-blue-600 font-medium hover:underline mt-4 inline-block">
            Xem tất cả lịch sử &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
