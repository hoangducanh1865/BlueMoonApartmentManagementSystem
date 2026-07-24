import React, { useState, useEffect } from 'react';
import { getAllFeeDefinitions, createFeeDefinition } from '../../../../lib/feeService';
import { Plus, Loader2, RefreshCcw, Banknote, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import { FeeDefinition } from '@/src/lib/types';

const FeeManager: React.FC = () => {
  const [fees, setFees] = useState<FeeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<FeeDefinition>>({
    name: '',
    description: '',
    unitPrice: 0,
    unit: 'm2',
    billingCycle: 'monthly',
    isMandatory: true
  });

  const loadFees = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllFeeDefinitions();
      setFees(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách khoản phí');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      name: '',
      description: '',
      unitPrice: 0,
      unit: 'm2',
      billingCycle: 'monthly',
      isMandatory: true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createFeeDefinition(formData);
      alert('Thêm khoản phí thành công!');
      setIsModalOpen(false);
      loadFees();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý các khoản thu</h1>
          <p className="text-sm text-gray-500">Danh mục các loại phí trong chung cư</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm khoản phí mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            {error}
            <button onClick={loadFees} className="block mx-auto mt-2 text-blue-600 hover:underline flex items-center justify-center">
              <RefreshCcw className="w-4 h-4 mr-1" /> Thử lại
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Tên khoản phí</th>
                  <th className="px-6 py-4">Mô tả</th>
                  <th className="px-6 py-4">Đơn giá</th>
                  <th className="px-6 py-4">Đơn vị tính</th>
                  <th className="px-6 py-4">Chu kỳ</th>
                  <th className="px-6 py-4">Loại phí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                      <div className="p-1.5 bg-green-50 text-green-600 rounded-full mr-3">
                        <Banknote className="w-4 h-4" />
                      </div>
                      {fee.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={fee.description}>
                      {fee.description}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {formatCurrency(fee.unitPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {fee.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {fee.billingCycle === 'monthly' ? 'Hàng tháng' :
                        fee.billingCycle === 'yearly' ? 'Hàng năm' :
                          fee.billingCycle === 'one-time' ? 'Một lần' : fee.billingCycle}
                    </td>
                    <td className="px-6 py-4">
                      {fee.isMandatory ? (
                        <span className="flex items-center text-red-600 text-xs font-semibold bg-red-50 px-2 py-1 rounded w-fit">
                          <ShieldAlert className="w-3 h-3 mr-1" /> Bắt buộc
                        </span>
                      ) : (
                        <span className="flex items-center text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-1 rounded w-fit">
                          <ShieldCheck className="w-3 h-3 mr-1" /> Tự nguyện
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {fees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Chưa có khoản phí nào được định nghĩa
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Thêm khoản phí mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khoản phí <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Phí quản lý chung cư"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả mục đích thu phí..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá (VND) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.unitPrice}
                    onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="m2, người, hộ, xe..."
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chu kỳ thu</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.billingCycle}
                    onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                  >
                    <option value="monthly">Hàng tháng</option>
                    <option value="yearly">Hàng năm</option>
                    <option value="one-time">Thu một lần</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tính chất</label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        checked={formData.isMandatory === true}
                        onChange={() => setFormData({ ...formData, isMandatory: true })}
                      />
                      <span className="ml-2 text-sm text-gray-700">Bắt buộc</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        checked={formData.isMandatory === false}
                        onChange={() => setFormData({ ...formData, isMandatory: false })}
                      />
                      <span className="ml-2 text-sm text-gray-700">Tự nguyện</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isSubmitting ? 'Đang thêm...' : 'Tạo khoản phí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManager;
