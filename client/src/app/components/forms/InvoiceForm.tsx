import React from 'react';
import { X, AlertTriangle, Loader2, Banknote } from 'lucide-react';
import { Household, FeeDefinition } from '@/src/lib/types';

export interface InvoiceFormItem {
  feeId: number;
  quantity: number;
}

interface InvoiceFormProps {
  households: Household[];
  feeDefinitions: FeeDefinition[];
  formHouseId: string;
  formMonth: number;
  formYear: number;
  formDueDate: string;
  formItems: InvoiceFormItem[];
  onHouseChange: (id: string) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onDueDateChange: (date: string) => void;
  onAddItem: (feeId: number) => void;
  onRemoveItem: (feeId: number) => void;
  onQuantityChange: (feeId: number, quantity: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string;
  title?: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  households,
  feeDefinitions,
  formHouseId,
  formMonth,
  formYear,
  formDueDate,
  formItems,
  onHouseChange,
  onMonthChange,
  onYearChange,
  onDueDateChange,
  onAddItem,
  onRemoveItem,
  onQuantityChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = '',
  title
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const totalAmount = formItems.reduce((acc, item) => {
    const fd = feeDefinitions.find(f => f.id === item.feeId);
    return acc + (fd ? fd.unitPrice * item.quantity : 0);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {title || 'Phát hành hóa đơn mới'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center text-sm rounded">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Căn hộ</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formHouseId}
                onChange={e => onHouseChange(e.target.value)}
              >
                <option value="">Chọn căn hộ...</option>
                {households.map(h => (
                  <option key={h.id} value={h.id}>P.{h.roomNumber} - {h.ownerName}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formMonth}
                  onChange={e => onMonthChange(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formYear}
                  onChange={e => onYearChange(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hạn đóng</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formDueDate}
                onChange={e => onDueDateChange(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
              <span className="font-semibold text-gray-700">Chi tiết khoản phí</span>
              <div className="flex gap-2">
                <select
                  className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => e.target.value && onAddItem(Number(e.target.value))}
                  value=""
                >
                  <option value="">+ Thêm loại phí...</option>
                  {feeDefinitions.map(fd => (
                    <option key={fd.id} value={fd.id}>{fd.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">Tên khoản phí</th>
                  <th className="px-4 py-2 text-left">Đơn giá</th>
                  <th className="px-4 py-2 text-center">Số lượng</th>
                  <th className="px-4 py-2 text-right">Thành tiền</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {formItems.map(item => {
                  const fd = feeDefinitions.find(f => f.id === item.feeId);
                  if (!fd) return null;
                  return (
                    <tr key={item.feeId}>
                      <td className="px-4 py-3 font-medium text-gray-800">{fd.name}</td>
                      <td className="px-4 py-3 text-gray-500">{formatCurrency(fd.unitPrice)} / {fd.unit}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          className="w-20 mx-auto block px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500"
                          value={item.quantity}
                          onChange={e => onQuantityChange(item.feeId, Number(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-700">
                        {formatCurrency(fd.unitPrice * item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!fd.isMandatory && (
                          <button type="button" onClick={() => onRemoveItem(item.feeId)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {formItems.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Vui lòng thêm ít nhất một khoản phí</td></tr>
                )}
              </tbody>
              <tfoot className="bg-blue-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-blue-800">Tổng cộng:</td>
                  <td className="px-4 py-3 text-right font-bold text-xl text-blue-900">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 flex items-center transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
              Xác nhận phát hành
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
