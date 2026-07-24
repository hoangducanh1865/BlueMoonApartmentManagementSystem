import React from 'react';
import { X, Plus } from 'lucide-react';

export interface FeeFormData {
  name: string;
  description: string;
  unitPrice: number;
  unit: string;
  billingCycle: string;
  isMandatory: boolean;
}

interface FeeFormProps {
  formData: FeeFormData;
  onChange: (data: FeeFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
  title?: string;
}

const FeeForm: React.FC<FeeFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEditing = false,
  isSubmitting = false,
  title
}) => {
  const handleChange = (field: keyof FeeFormData, value: string | number | boolean) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-600" />
            {title || (isEditing ? 'Sửa khoản phí' : 'Thêm khoản phí mới')}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên khoản phí <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Phí dịch vụ, Phí gửi xe..."
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Mô tả chi tiết về khoản phí..."
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn giá <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="50000"
                value={formData.unitPrice || ''}
                onChange={e => handleChange('unitPrice', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn vị tính <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.unit}
                onChange={e => handleChange('unit', e.target.value)}
              >
                <option value="">Chọn đơn vị...</option>
                <option value="hộ">Hộ</option>
                <option value="m2">m² (mét vuông)</option>
                <option value="xe">Xe</option>
                <option value="người">Người</option>
                <option value="tháng">Tháng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chu kỳ thu <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.billingCycle}
              onChange={e => handleChange('billingCycle', e.target.value)}
            >
              <option value="">Chọn chu kỳ...</option>
              <option value="MONTHLY">Hàng tháng</option>
              <option value="QUARTERLY">Hàng quý</option>
              <option value="YEARLY">Hàng năm</option>
              <option value="ONE_TIME">Một lần</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tính chất khoản phí
            </label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="isMandatory"
                  checked={formData.isMandatory}
                  onChange={() => handleChange('isMandatory', true)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Bắt buộc</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="isMandatory"
                  checked={!formData.isMandatory}
                  onChange={() => handleChange('isMandatory', false)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Tự nguyện</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeeForm;
