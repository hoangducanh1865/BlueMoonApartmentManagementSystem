import React, { useState, useEffect } from 'react';
import { Registration, RegistrationStatus, RegistrationType, ResidentMember, User, CreateRegistrationRequest } from '@/src/lib/types';
import { getRegistrations, createRegistration, updateRegistration, deleteRegistration } from '../../../lib/registrationService';
import { getHouseholdMembers } from '../../../lib/householdService';
import {
  Loader2, RefreshCcw, CheckCircle, XCircle, Clock, MapPin, X, Plus, Info, Calendar, User as UserIcon, Send, AlertCircle, Trash2, AlertTriangle, Edit2
} from 'lucide-react';

interface ResidentRegistrationProps {
  user: User;
}

const ResidentRegistration: React.FC<ResidentRegistrationProps> = ({ user }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [members, setMembers] = useState<ResidentMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formResidentId, setFormResidentId] = useState('');
  const [formType, setFormType] = useState<RegistrationType>(RegistrationType.TAM_VANG);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Helper: Chuyển đổi ID sang số nguyên an toàn (ví dụ "h1" -> 1)
  const cleanId = (id: any): number => {
    if (typeof id === 'number') return id;
    if (!id || id === 'undefined') return 0;
    const match = String(id).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await getRegistrations(0, 100);
      setRegistrations(data.content);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (user.householdId) {
      try {
        const data = await getHouseholdMembers(user.householdId);
        setMembers(data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchMembers();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormResidentId('');
    setFormType(RegistrationType.TAM_VANG);
    setFormStartDate('');
    setFormEndDate('');
    setFormReason('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reg: Registration) => {
    console.log("Editing registration:", reg);
    setEditingId(reg.id);
    // Ưu tiên lấy ID từ reg, nếu không có thì để trống thay vì "undefined"
    setFormResidentId(reg.residentId ? String(reg.residentId) : '');
    setFormType(reg.type);
    setFormStartDate(reg.startDate);
    setFormEndDate(reg.endDate);
    setFormReason(reg.reason);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra dữ liệu trước khi gửi
    const resId = cleanId(formResidentId);
    const houseId = cleanId(user.householdId);

    if (resId === 0) {
      alert("Vui lòng chọn thành viên đăng ký");
      return;
    }

    if (houseId === 0) {
      alert("Không tìm thấy thông tin căn hộ của bạn");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateRegistrationRequest = {
        residentId: resId,
        houseId: houseId,
        type: formType,
        startDate: formStartDate,
        endDate: formEndDate,
        reason: formReason
      };

      console.log("Sending payload:", payload);

      if (editingId) {
        await updateRegistration(editingId, payload);
        alert('Cập nhật yêu cầu thành công!');
      } else {
        await createRegistration(payload);
        alert('Yêu cầu đã được gửi thành công! Vui lòng đợi Ban quản lý phê duyệt.');
      }

      setIsModalOpen(false);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi xử lý yêu cầu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const msg = await deleteRegistration(deleteConfirmId);
      alert(msg);
      setDeleteConfirmId(null);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.PENDING: return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-100"><Clock className="w-3 h-3" /> CHỜ DUYỆT</span>;
      case RegistrationStatus.APPROVED: return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100"><CheckCircle className="w-3 h-3" /> ĐÃ DUYỆT</span>;
      case RegistrationStatus.REJECTED: return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100"><XCircle className="w-3 h-3" /> TỪ CHỐI</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Tạm trú & Tạm vắng</h1>
          <p className="text-sm text-gray-500 font-medium">Đăng ký cho các thành viên trong gia đình</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Gửi yêu cầu mới
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map(reg => (
            <div key={reg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-all relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${reg.type === RegistrationType.TAM_TRU ? 'bg-blue-600' : 'bg-orange-600'}`}></div>

              <div className="flex justify-between items-start mb-4 relative">
                <div className={`p-2 rounded-lg ${reg.type === RegistrationType.TAM_TRU ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(reg.status)}
                  {reg.status === RegistrationStatus.PENDING && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEdit(reg)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Sửa yêu cầu">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(reg.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Hủy yêu cầu">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-black text-gray-900 text-lg mb-1">{reg.residentName}</h3>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className={reg.type === RegistrationType.TAM_TRU ? 'text-blue-600' : 'text-orange-600'}>
                  {reg.type === RegistrationType.TAM_TRU ? 'Đăng ký Tạm trú' : 'Đăng ký Tạm vắng'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-400 font-mono">P.{reg.roomNumber}</span>
              </p>

              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 font-medium">
                    {new Date(reg.startDate).toLocaleDateString('vi-VN')} → {new Date(reg.endDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 italic text-sm text-gray-500">
                  "{reg.reason}"
                </div>
              </div>

              {reg.adminNote && (
                <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-700 font-medium">BQL: {reg.adminNote}</p>
                </div>
              )}
            </div>
          ))}

          {registrations.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">Chưa có yêu cầu đăng ký nào.</p>
              <p className="text-sm text-gray-400">Gửi yêu cầu đầu tiên ngay khi có nhu cầu tạm trú/tạm vắng.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Hủy yêu cầu này?</h3>
            <p className="text-sm text-gray-500 mb-6">Bạn có chắc chắn muốn hủy yêu cầu đăng ký này không?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Không, quay lại</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md">Xác nhận hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Create & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-900 flex items-center"><Send className="w-5 h-5 mr-2 text-blue-600" /> {editingId ? 'Cập nhật yêu cầu' : 'Gửi yêu cầu đăng ký'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Thành viên đăng ký</label>
                  <select
                    required
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                    value={formResidentId}
                    onChange={e => setFormResidentId(e.target.value)}
                  >
                    <option value="" className="text-gray-400">Chọn thành viên...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id} className="text-gray-900">{m.fullName} ({m.relationToOwner})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Hình thức</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormType(RegistrationType.TAM_TRU)}
                      className={`flex-1 py-2.5 rounded-xl font-bold border transition-all ${formType === RegistrationType.TAM_TRU ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                      Tạm trú
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType(RegistrationType.TAM_VANG)}
                      className={`flex-1 py-2.5 rounded-xl font-bold border transition-all ${formType === RegistrationType.TAM_VANG ? 'bg-orange-50 border-orange-600 text-orange-600' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                      Tạm vắng
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Ngày bắt đầu</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900"
                        value={formStartDate}
                        onChange={e => setFormStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Ngày kết thúc</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900"
                        value={formEndDate}
                        onChange={e => setFormEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Lý do cụ thể</label>
                  <textarea
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
                    rows={3}
                    placeholder="Ví dụ: Về quê ăn Tết, đi công tác, có người thân đến thăm..."
                    value={formReason}
                    onChange={e => setFormReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-800 font-medium">
                  Yêu cầu sẽ được Ban quản lý xem xét và phê duyệt trong vòng 24h làm việc.
                  Mọi thắc mắc vui lòng liên hệ văn phòng tòa nhà.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {editingId ? 'Cập nhật yêu cầu' : 'Gửi yêu cầu phê duyệt'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentRegistration;
