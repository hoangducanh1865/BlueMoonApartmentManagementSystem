import React, { useState, useEffect } from 'react';
import { User, Household, RequestTicket, RequestChange, ApartmentStatus, ResidentMember } from '@/src/lib/types';
import { MOCK_REQUESTS } from '../../../lib/mockData';
import { getHouseholdById, getHouseholdMembers } from '../../../lib/householdService';
import { User as UserIcon, Home, Phone, Users, Ruler, Edit3, History, Clock, CheckCircle, XCircle, Send, X, ArrowRight, Loader2, Building, Activity } from 'lucide-react';

interface ResidentProfileProps {
  user: User;
}

const ResidentProfile: React.FC<ResidentProfileProps> = ({ user }) => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<ResidentMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Still using mock requests for now
  const [myRequests, setMyRequests] = useState<RequestTicket[]>(
    MOCK_REQUESTS.filter(r => r.householdId === user.householdId)
  );

  // Modal State for Creating Request
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<keyof Household | 'other'>('phoneNumber');
  const [newValue, setNewValue] = useState('');
  const [description, setDescription] = useState('');

  // Modal State for Viewing Request
  const [viewRequest, setViewRequest] = useState<RequestTicket | null>(null);

  useEffect(() => {
    const fetchHouseholdData = async () => {
      if (user.householdId) {
        try {
          const [householdData, membersData] = await Promise.all([
            getHouseholdById(user.householdId),
            getHouseholdMembers(user.householdId)
          ]);
          setHousehold(householdData);
          setMembers(membersData);
        } catch (error) {
          console.error("Failed to fetch household info", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchHouseholdData();
  }, [user.householdId]);

  // Fields allowed to request change
  const editableFields: { key: keyof Household; label: string }[] = [
    { key: 'ownerName', label: 'Tên chủ hộ' },
    { key: 'phoneNumber', label: 'Số điện thoại' },
    { key: 'memberCount', label: 'Số nhân khẩu' },
    { key: 'area', label: 'Diện tích căn hộ' },
  ];

  const getOldValue = (key: keyof Household | 'other') => {
    if (!household || key === 'other') return '';
    return household[key];
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!household) return;

    const selectedField = editableFields.find(f => f.key === requestType);

    const changes: RequestChange[] = selectedField ? [{
      key: String(selectedField.key),
      label: selectedField.label,
      oldValue: getOldValue(selectedField.key) as string | number,
      newValue: newValue
    }] : [];

    const newRequest: RequestTicket = {
      id: `r${Date.now()}`,
      title: selectedField ? `Yêu cầu sửa ${selectedField.label}` : 'Yêu cầu khác',
      description: description,
      status: 'PENDING',
      householdId: household.id,
      createdAt: new Date().toISOString().split('T')[0],
      changes: changes
    };

    setMyRequests([newRequest, ...myRequests]);
    setIsModalOpen(false);
    // Reset form
    setNewValue('');
    setDescription('');
    alert('Đã gửi yêu cầu thành công! Ban quản lý sẽ xem xét sớm.');
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Đã duyệt</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Từ chối</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!household) {
    return <div className="p-4 text-red-500">Không tìm thấy thông tin căn hộ liên kết với tài khoản này.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Hồ sơ cá nhân</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: User & Household Info */}
        <div className="md:col-span-2 space-y-6">

          {/* User Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <img src={user.avatar || 'https://picsum.photos/200'} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-blue-100" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">{user.fullName}</h2>
                <p className="text-gray-500">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Cư dân
                </span>
              </div>
            </div>
          </div>

          {/* Household Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Home className="w-5 h-5 mr-2 text-blue-600" />
                Thông tin căn hộ
              </h3>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Báo sai sót / Sửa đổi
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Mã căn hộ</p>
                <p className="text-lg font-bold text-gray-800">{household.roomNumber}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg flex items-center">
                <Building className="w-8 h-8 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Tòa nhà</p>
                  <p className="text-lg font-medium text-gray-800">{household.building || '---'}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg flex items-center">
                <Ruler className="w-8 h-8 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Diện tích</p>
                  <p className="text-lg font-medium text-gray-800">{household.area} m²</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg flex items-center">
                <Users className="w-8 h-8 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Nhân khẩu</p>
                  <p className="text-lg font-medium text-gray-800">{household.memberCount} người</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg flex items-center">
                <Phone className="w-8 h-8 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Số điện thoại</p>
                  <p className="text-lg font-medium text-gray-800">{household.phoneNumber || '---'}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg flex items-center">
                <Activity className="w-8 h-8 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Trạng thái</p>
                  <p className="text-lg font-medium text-gray-800">
                    {household.status === ApartmentStatus.EMPTY ? 'Trống'
                      : household.status === ApartmentStatus.MAINTENANCE ? 'Đang bảo trì'
                        : 'Có người ở'}
                  </p>
                </div>
              </div>
            </div>

            <h4 className="font-semibold text-gray-700 mb-3 border-t pt-4">Danh sách thành viên</h4>
            <div className="overflow-hidden border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quan hệ</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map(member => (
                    <tr key={member.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{member.fullName}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{member.relationToOwner}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-gray-400 text-sm">Chưa có thông tin thành viên</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800">
              <p><strong>Lưu ý:</strong> Mọi thay đổi về thông tin hộ khẩu (số người, chủ hộ, diện tích) cần được Ban Quản Lý phê duyệt trước khi cập nhật vào hệ thống.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Request History */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <History className="w-5 h-5 mr-2 text-gray-500" />
              Lịch sử yêu cầu
            </h3>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px]">
              {myRequests.length > 0 ? (
                myRequests.map((req) => (
                  <div key={req.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setViewRequest(req)}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">{req.createdAt}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="font-medium text-sm text-gray-800 line-clamp-2 group-hover:text-blue-600">{req.title}</p>
                    <div className="flex justify-end mt-2">
                      <span className="text-xs text-blue-500 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Xem chi tiết <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Chưa có yêu cầu nào.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Request Form (Create) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Gửi yêu cầu sửa đổi</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin cần sửa</label>
                <select
                  value={requestType}
                  onChange={(e) => {
                    setRequestType(e.target.value as any);
                    setNewValue('');
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {editableFields.map(field => (
                    <option key={field.key} value={field.key}>{field.label}</option>
                  ))}
                  <option value="other">Khác</option>
                </select>
              </div>

              {requestType !== 'other' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Giá trị hiện tại</label>
                    <input
                      type="text"
                      disabled
                      value={getOldValue(requestType)}
                      className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-1">Giá trị mới mong muốn</label>
                    <input
                      type="text"
                      required
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="block w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                      placeholder="Nhập giá trị mới..."
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {requestType === 'other' ? 'Nội dung yêu cầu' : 'Lý do thay đổi / Ghi chú'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Vui lòng mô tả chi tiết lý do..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Request Detail */}
      {viewRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Chi tiết yêu cầu</h2>
                <p className="text-sm text-gray-500">Mã: {viewRequest.id}</p>
              </div>
              <button onClick={() => setViewRequest(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-gray-700 mb-1">Trạng thái</p>
                <StatusBadge status={viewRequest.status} />
              </div>

              <div>
                <p className="font-semibold text-gray-700">Tiêu đề</p>
                <p className="text-gray-900">{viewRequest.title}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700">Nội dung / Lý do</p>
                <p className="text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 mt-1">{viewRequest.description}</p>
              </div>

              {viewRequest.changes && viewRequest.changes.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Chi tiết thay đổi</p>
                  <div className="text-sm border rounded-lg overflow-hidden">
                    {viewRequest.changes.map((c, i) => (
                      <div key={i} className="flex bg-gray-50 p-2">
                        <div className="flex-1">
                          <span className="block text-gray-500 text-xs">{c.label} (Cũ)</span>
                          <span className="font-medium text-red-600 line-through">{c.oldValue}</span>
                        </div>
                        <div className="flex items-center px-2 text-gray-400">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <span className="block text-gray-500 text-xs">{c.label} (Mới)</span>
                          <span className="font-bold text-green-600">{c.newValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewRequest.status === 'REJECTED' && viewRequest.rejectReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 font-bold text-sm mb-1">Phản hồi từ Ban Quản Lý:</p>
                  <p className="text-red-700 text-sm">{viewRequest.rejectReason}</p>
                </div>
              )}
              {viewRequest.status === 'APPROVED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 font-bold text-sm">Ban Quản Lý đã chấp thuận yêu cầu và cập nhật dữ liệu.</p>
                </div>
              )}
            </div>

            <div className="mt-6 text-right">
              <button onClick={() => setViewRequest(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentProfile;
