import React from 'react';
import { ApartmentStatus, ApartmentType } from '@/src/lib/types';
import { Users, X } from 'lucide-react';

export interface HouseholdFormData {
  roomNumber: string;
  ownerName: string;
  area: number;
  memberCount: number;
  phoneNumber: string;
  building: string;
  floor: number;
  status: ApartmentStatus;
  type: ApartmentType;
}

interface HouseholdFormProps {
  formData: HouseholdFormData;
  onChange: (data: HouseholdFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  title?: string;
}

const HouseholdForm: React.FC<HouseholdFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEditing,
  title
}) => {
  const handleChange = (field: keyof HouseholdFormData, value: string | number) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {title || (isEditing ? 'Sửa thông tin hộ khẩu' : 'Thêm hộ khẩu mới')}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tòa nhà</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="A1, B2..."
                value={formData.building || ''}
                onChange={e => handleChange('building', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tầng</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.floor || ''}
                onChange={e => handleChange('floor', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số phòng</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.roomNumber || ''}
                onChange={e => handleChange('roomNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích (m²)</label>
              <input
                type="number"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.area || ''}
                onChange={e => handleChange('area', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại căn hộ</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.type || ApartmentType.NORMAL}
                onChange={e => handleChange('type', e.target.value as ApartmentType)}
              >
                <option value={ApartmentType.NORMAL}>Căn hộ thường</option>
                <option value={ApartmentType.PENTHOUSE}>Penthouse</option>
                <option value={ApartmentType.KIOT}>Kiot</option>
                <option value={ApartmentType.OFFICE}>Văn phòng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.status || ApartmentStatus.OCCUPIED}
                onChange={e => handleChange('status', e.target.value as ApartmentStatus)}
              >
                <option value={ApartmentStatus.EMPTY}>Trống</option>
                <option value={ApartmentStatus.OCCUPIED}>Có người ở</option>
                <option value={ApartmentStatus.MAINTENANCE}>Đang bảo trì</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4 mt-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Thông tin chủ hộ
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên chủ hộ</label>
              <input
                type="text"
                required={formData.status === ApartmentStatus.OCCUPIED}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nguyễn Văn A"
                value={formData.ownerName || ''}
                onChange={e => handleChange('ownerName', e.target.value)}
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại liên hệ</label>
              <input
                type="text"
                required={formData.status === ApartmentStatus.OCCUPIED}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="09xx.xxx.xxx"
                value={formData.phoneNumber || ''}
                onChange={e => handleChange('phoneNumber', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isEditing ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HouseholdForm;
