import React, { useState, useEffect } from 'react';
import { getInvoices, simulatePayment } from '../../../../lib/invoiceService';
import { Search, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Invoice, User } from '@/src/lib/types';

interface FeeListProps {
  user: User;
}

const FeeList: React.FC<FeeListProps> = ({ user }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await getInvoices(0, 100);
        setInvoices(data.content);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const toggleSelection = (id: number) => {
    const newSelection = new Set(selectedInvoiceIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedInvoiceIds(newSelection);
  };

  const totalSelectedAmount = unpaidInvoices
    .filter(inv => selectedInvoiceIds.has(inv.id))
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const handlePayment = async () => {
    if (selectedInvoiceIds.size === 0) return;

    setIsProcessing(true);
    try {
      // Pay each selected invoice
      for (const invoiceId of Array.from(selectedInvoiceIds)) {
        await simulatePayment(invoiceId as number);
      }

      // Refresh invoices after payment
      const data = await getInvoices(0, 100);
      setInvoices(data.content);
      setSelectedInvoiceIds(new Set());
      alert('Thanh toán thành công!');
    } catch (error: any) {
      alert(error.message || 'Thanh toán thất bại');
    } finally {
      setIsProcessing(false);
    }
    alert('Thanh toán thành công!');
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Danh sách khoản phí</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="font-semibold text-gray-700">Các khoản phí cần thanh toán</span>
          <span className="text-sm text-gray-500">{unpaidInvoices.length} hóa đơn</span>
        </div>

        <div className="divide-y divide-gray-100">
          {unpaidInvoices.length > 0 ? (
            unpaidInvoices.map(invoice => (
              <div key={invoice.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedInvoiceIds.has(invoice.id)}
                  onChange={() => toggleSelection(invoice.id)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{invoice.title}</p>
                  <p className="text-sm text-gray-500">Hạn nộp: {new Date(invoice.dueDate).toLocaleDateString('vi-VN')} | Tháng {invoice.month}/{invoice.year}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Chờ thanh toán
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p>Tuyệt vời! Bạn đã thanh toán hết các hóa đơn.</p>
            </div>
          )}
        </div>

        {unpaidInvoices.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between sticky bottom-0">
            <div>
              <p className="text-sm text-gray-500">Tổng thanh toán</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totalSelectedAmount)}</p>
            </div>
            <button
              onClick={handlePayment}
              disabled={selectedInvoiceIds.size === 0 || isProcessing}
              className={`px-6 py-2.5 rounded-lg font-medium text-white shadow-sm transition-all ${selectedInvoiceIds.size === 0 || isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                }`}
            >
              {isProcessing ? 'Đang xử lý...' : 'Thanh toán ngay'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Lịch sử đã đóng gần đây</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {invoices.filter(inv => inv.status === 'paid').slice(0, 5).map(invoice => (
            <div key={invoice.id} className="p-4 flex items-center justify-between opacity-75">
              <div>
                <p className="font-medium text-gray-800">{invoice.title}</p>
                <p className="text-xs text-green-600 font-medium flex items-center mt-1">
                  <CheckCircle className="w-3 h-3 mr-1" /> Đã thanh toán - Tháng {invoice.month}/{invoice.year}
                </p>
              </div>
              <p className="font-medium text-gray-600">{formatCurrency(invoice.totalAmount)}</p>
            </div>
          ))}
          {invoices.filter(inv => inv.status === 'paid').length === 0 && (
            <div className="p-4 text-center text-sm text-gray-400">Chưa có lịch sử.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeList;
