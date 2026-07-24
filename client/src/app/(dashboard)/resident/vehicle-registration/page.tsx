import React, { useState, useEffect } from 'react';
import { User, VehicleRegistration, CreateVehicleRegistrationRequest, VehicleType, SubscriptionType } from '@/src/lib/types';
import { getRegistrationsByResidentId, createVehicleRegistration } from '@/src/lib/parkingService';
import { Loader2, Plus, Car, Bike, AlertCircle, CheckCircle } from 'lucide-react';

interface ResidentVehicleRegistrationProps {
  user: User;
}

const ResidentVehicleRegistration: React.FC<ResidentVehicleRegistrationProps> = ({ user }) => {
  const [registrations, setRegistrations] = useState<VehicleRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateVehicleRegistrationRequest>({
    licensePlate: '',
    vehicleType: VehicleType.CAR,
    brand: '',
    color: '',
    residentId: user.residentId || 0,
    subscriptionType: SubscriptionType.MONTHLY,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user.residentId) {
      fetchRegistrations();
    } else {
      setLoading(false);
    }
  }, [user.residentId]);

  const fetchRegistrations = async () => {
    if (!user.residentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getRegistrationsByResidentId(user.residentId);
      setRegistrations(data);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.residentId) {
      setError('Không tìm thấy thông tin cư dân');
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      await createVehicleRegistration({
        ...formData,
        residentId: user.residentId
      });
      setSuccess('Gửi yêu cầu đăng ký thành công!');
      setShowForm(false);
      setFormData({
        licensePlate: '',
        vehicleType: VehicleType.CAR,
        brand: '',
        color: '',
        residentId: user.residentId,
        subscriptionType: SubscriptionType.MONTHLY,
      });
      fetchRegistrations();
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return 'Chờ duyệt';
    }
  };

  if (loading && !registrations.length) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!user.residentId) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Chưa có thông tin cư dân</h2>
        <p className="text-gray-500">
          Tài khoản của bạn chưa được liên kết với hồ sơ cư dân. Vui lòng liên hệ ban quản lý.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Đăng ký phương tiện</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Đăng ký mới
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Thông tin xe</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.licensePlate}
                  onChange={e => setFormData({...formData, licensePlate: e.target.value})}
                  placeholder="VD: 30A-123.45"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại xe</label>
                <select
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.vehicleType}
                  onChange={e => setFormData({...formData, vehicleType: e.target.value as VehicleType})}
                >
                  <option value={VehicleType.CAR}>Ô tô</option>
                  <option value={VehicleType.MOTORBIKE}>Xe máy</option>
                  <option value={VehicleType.BICYCLE}>Xe đạp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hãng xe</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.brand}
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                  placeholder="VD: Honda, Toyota"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  placeholder="VD: Đen, Trắng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại vé</label>
                <select
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.subscriptionType}
                  onChange={e => setFormData({...formData, subscriptionType: e.target.value as SubscriptionType})}
                >
                  <option value={SubscriptionType.MONTHLY}>Vé tháng</option>
                  <option value={SubscriptionType.QUARTERLY}>Vé quý</option>
                  <option value={SubscriptionType.YEARLY}>Vé năm</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gửi yêu cầu
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {registrations.map((reg) => (
          <div key={reg.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${reg.vehicleType === VehicleType.CAR ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                {reg.vehicleType === VehicleType.CAR ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{reg.licensePlate}</h3>
                <p className="text-sm text-gray-500">{reg.brand} - {reg.color}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reg.status)}`}>
                {getStatusText(reg.status)}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(reg.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        ))}
        {registrations.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Chưa có phương tiện nào được đăng ký
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentVehicleRegistration;
