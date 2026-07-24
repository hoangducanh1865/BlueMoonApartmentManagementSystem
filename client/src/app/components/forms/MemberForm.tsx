import React from 'react';
import { X, Plus, Key, ArrowRightCircle } from 'lucide-react';

export interface MemberFormData {
  fullName: string;
  dateOfBirth: string;
  relationToOwner: string;
  cccd: string;
  phoneNumber: string;
  email: string;
  status: string;
  newRoomNumber?: string;
}

interface AddMemberFormProps {
  formData: MemberFormData;
  onChange: (data: MemberFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

interface EditMemberFormProps {
  formData: MemberFormData;
  onChange: (data: MemberFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  title?: string;
}

// Component for adding a new member (inline form)
export const AddMemberForm: React.FC<AddMemberFormProps> = ({
  formData,
  onChange,
  onSubmit,
  isSubmitting = false
}) => {
  const handleChange = (field: keyof MemberFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
        <Plus className="w-4 h-4 mr-1" /> Thêm thành viên mới
      </h3>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <input
          placeholder="Họ và tên *"
          required
          className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formData.fullName}
          onChange={e => handleChange('fullName', e.target.value)}
        />
        <input
          type="date"
          required
          className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formData.dateOfBirth}
          onChange={e => handleChange('dateOfBirth', e.target.value)}
        />
        <select
          className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
          value={formData.relationToOwner}
          onChange={e => handleChange('relationToOwner', e.target.value)}
        >
          <option value="">Quan hệ...</option>
          <option value="Chủ hộ">Chủ hộ</option>
          <option value="Vợ">Vợ</option>
          <option value="Chồng">Chồng</option>
          <option value="Con">Con</option>
          <option value="Bố">Bố</option>
          <option value="Mẹ">Mẹ</option>
          <option value="Khác">Khác</option>
        </select>
        <input
          placeholder="Số điện thoại"
          className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formData.phoneNumber}
          onChange={e => handleChange('phoneNumber', e.target.value)}
        />
        <input
          placeholder="CCCD/CMND"
          className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formData.cccd}
          onChange={e => handleChange('cccd', e.target.value)}
        />
        <input
          type="email"
          placeholder="Email liên hệ"
          className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formData.email}
          onChange={e => handleChange('email', e.target.value)}
        />
        <select
          className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formData.status}
          onChange={e => handleChange('status', e.target.value)}
        >
          <option value="THUONG_TRU">Thường trú</option>
          <option value="TAM_TRU">Tạm trú</option>
          <option value="TAM_VANG">Tạm vắng</option>
        </select>

        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-right mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center">
            <Key className="w-3 h-3 mr-1" /> Mã cư dân tự động
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-300"
          >
            {isSubmitting ? 'Đang thêm...' : 'Thêm vào hộ'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Component for editing a member (modal form)
export const EditMemberForm: React.FC<EditMemberFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  title
}) => {
  const handleChange = (field: keyof MemberFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[55] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {title || 'Sửa thông tin nhân khẩu'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.dateOfBirth}
                onChange={e => handleChange('dateOfBirth', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quan hệ với chủ hộ</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.relationToOwner}
                onChange={e => handleChange('relationToOwner', e.target.value)}
              >
                <option value="">Quan hệ...</option>
                <option value="Chủ hộ">Chủ hộ</option>
                <option value="Vợ">Vợ</option>
                <option value="Chồng">Chồng</option>
                <option value="Con">Con</option>
                <option value="Bố">Bố</option>
                <option value="Mẹ">Mẹ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái cư trú</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={e => handleChange('status', e.target.value)}
              >
                <option value="THUONG_TRU">Thường trú</option>
                <option value="TAM_TRU">Tạm trú</option>
                <option value="TAM_VANG">Tạm vắng</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.phoneNumber}
                onChange={e => handleChange('phoneNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CCCD/CMND</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.cccd}
                onChange={e => handleChange('cccd', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.email || ''}
              onChange={e => handleChange('email', e.target.value)}
            />
          </div>

          <div className="border-t border-gray-100 pt-4 mt-2">
            <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center">
              <ArrowRightCircle className="w-4 h-4 mr-2" />
              Chuyển hộ khẩu (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Nhập mã phòng mới để chuyển..."
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              value={formData.newRoomNumber || ''}
              onChange={e => handleChange('newRoomNumber', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              * Nếu nhập số phòng mới, cư dân sẽ bị xóa khỏi hộ hiện tại và chuyển sang hộ mới.
            </p>
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default { AddMemberForm, EditMemberForm };
