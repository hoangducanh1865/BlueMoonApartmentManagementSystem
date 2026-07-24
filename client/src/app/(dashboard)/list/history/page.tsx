import React, { useState, useEffect } from 'react';
import { getInvoices } from '../../../../lib/invoiceService';
import { CheckCircle, AlertTriangle, FileText, Search, Loader2 } from 'lucide-react';
import { Invoice, User } from '@/src/lib/types';

interface PaymentHistoryProps {
  user: User;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ user }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await getInvoices(0, 100);
        // Filter only paid invoices for history
        setInvoices(data.content.filter(inv => inv.status === 'paid'));
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Lịch sử thanh toán</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo số phòng..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Mã Hóa Đơn</th>
                <th className="px-6 py-4">Tiêu Đề</th>
                <th className="px-6 py-4">Tháng/Năm</th>
                <th className="px-6 py-4">Số Phòng</th>
                <th className="px-6 py-4">Số Tiền</th>
                <th className="px-6 py-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-500">#{invoice.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{invoice.title}</td>
                  <td className="px-6 py-4">{invoice.month}/{invoice.year}</td>
                  <td className="px-6 py-4">{invoice.roomNumber}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" /> Đã thanh toán
                    </span>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    Chưa có giao dịch nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
