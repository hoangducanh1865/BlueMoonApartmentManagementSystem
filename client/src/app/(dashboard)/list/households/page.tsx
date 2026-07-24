import React, { useState, useEffect } from 'react';
import { getHouseholds, createHousehold, updateHousehold, deleteHousehold, getHouseholdMembers, addHouseholdMember, updateHouseholdMember } from '../../../../lib/householdService';
import { Search, Plus, Edit2, Trash2, Users, X, Key, Loader2, RefreshCcw, AlertTriangle, ArrowRightCircle } from 'lucide-react';
import { ApartmentStatus, ApartmentType, Household, ResidentMember } from '@/src/lib/types';

const HouseholdManager: React.FC = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [householdMembers, setHouseholdMembers] = useState<ResidentMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Household>>({
    roomNumber: '',
    ownerName: '',
    area: 0,
    memberCount: 0,
    phoneNumber: '',
    building: '',
    floor: 0,
    status: ApartmentStatus.OCCUPIED,
    type: ApartmentType.NORMAL
  });

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);

  const [memberFormData, setMemberFormData] = useState<Partial<ResidentMember>>({
    fullName: '',
    dateOfBirth: '',
    relationToOwner: '',
    cccd: '',
    phoneNumber: '',
    email: '',
    status: 'THUONG_TRU'
  });

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberFormData, setEditMemberFormData] = useState<Partial<ResidentMember> & { newRoomNumber?: string }>({
    fullName: '',
    dateOfBirth: '',
    relationToOwner: '',
    cccd: '',
    phoneNumber: '',
    email: '',
    status: 'THUONG_TRU',
    newRoomNumber: ''
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'HOUSEHOLD' | 'MEMBER';
    id: string;
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadHouseholds = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getHouseholds(debouncedSearch);
      setHouseholds(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHouseholds();
  }, [debouncedSearch]);

  const initiateDeleteHousehold = (id: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'HOUSEHOLD',
      id: id,
      title: 'Xóa hộ khẩu',
      message: 'Bạn có chắc chắn muốn xóa hộ này? Hành động này không thể hoàn tác.'
    });
  };

  const initiateDeleteMember = (memberId: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'MEMBER',
      id: memberId,
      title: 'Xóa nhân khẩu',
      message: 'Bạn có chắc chắn muốn xóa thành viên này khỏi hộ?'
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === 'HOUSEHOLD') {
      try {
        await deleteHousehold(deleteConfirmation.id);
        setHouseholds(households.filter(h => h.id !== deleteConfirmation.id));
      } catch (err: any) {
        alert(err.message);
      }
    } else if (deleteConfirmation.type === 'MEMBER') {
      setHouseholdMembers(householdMembers.filter(m => m.id !== deleteConfirmation.id));
      if (selectedHousehold) {
        setHouseholds(households.map(h => {
          if (h.id === selectedHousehold.id) {
            return { ...h, memberCount: Math.max(0, h.memberCount - 1) };
          }
          return h;
        }));
      }
      alert("Đã xóa khỏi danh sách hiển thị.");
    }
    setDeleteConfirmation(null);
  };

  const handleEdit = (household: Household) => {
    setFormData(household);
    setEditingId(household.id);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({
      roomNumber: '',
      ownerName: '',
      area: 0,
      memberCount: 0,
      phoneNumber: '',
      building: '',
      floor: 0,
      status: ApartmentStatus.OCCUPIED,
      type: ApartmentType.NORMAL
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updated = await updateHousehold(editingId, formData);
        setHouseholds(households.map(h => h.id === editingId ? updated : h));
      } else {
        const created = await createHousehold(formData);
        setHouseholds([...households, created]);
      }
      setIsModalOpen(false);
      alert(editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenMembers = async (household: Household) => {
    setSelectedHousehold(household);
    setIsMemberModalOpen(true);
    setMemberFormData({ fullName: '', dateOfBirth: '', relationToOwner: '', cccd: '', phoneNumber: '', email: '', status: 'THUONG_TRU' });

    setLoadingMembers(true);
    try {
      const members = await getHouseholdMembers(household.id);
      setHouseholdMembers(members);
    } catch (e) {
      console.error(e);
      setHouseholdMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHousehold) return;

    setIsAddingMember(true);
    try {
      const newMember = await addHouseholdMember(selectedHousehold.id, memberFormData);
      setHouseholdMembers([...householdMembers, newMember]);
      setHouseholds(households.map(h => {
        if (h.id === selectedHousehold.id) {
          return { ...h, memberCount: h.memberCount + 1 };
        }
        return h;
      }));
      alert(`Đã thêm thành công!`);
      setMemberFormData({ fullName: '', dateOfBirth: '', relationToOwner: '', cccd: '', phoneNumber: '', email: '', status: 'THUONG_TRU' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingMember(false);
    }
  };

  const initiateEditMember = (member: ResidentMember) => {
    setEditingMemberId(member.id);
    setEditMemberFormData({
      fullName: member.fullName,
      dateOfBirth: member.dateOfBirth,
      relationToOwner: member.relationToOwner,
      cccd: member.cccd,
      phoneNumber: member.phoneNumber,
      email: member.email || '',
      status: member.status || 'THUONG_TRU',
      newRoomNumber: ''
    });
    setIsEditMemberModalOpen(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemberId) return;

    setIsUpdatingMember(true);
    try {
      const updatedMember = await updateHouseholdMember(editingMemberId, editMemberFormData);

      if (editMemberFormData.newRoomNumber && editMemberFormData.newRoomNumber.trim() !== '') {
        setHouseholdMembers(householdMembers.filter(m => m.id !== editingMemberId));
        alert(`Đã cập nhật và chuyển thành viên sang phòng ${editMemberFormData.newRoomNumber}`);
      } else {
        setHouseholdMembers(householdMembers.map(m => m.id === editingMemberId ? updatedMember : m));
        alert('Cập nhật thông tin thành công!');
      }
      setIsEditMemberModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingMember(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý hộ khẩu</h1>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm hộ mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm theo số phòng, tên chủ hộ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={loadHouseholds} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Tải lại">
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 m-4 rounded-lg border border-red-200">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Tòa nhà</th>
                  <th className="px-6 py-4">Số phòng</th>
                  <th className="px-6 py-4">Chủ hộ</th>
                  <th className="px-6 py-4">SĐT Liên hệ</th>
                  <th className="px-6 py-4">Loại</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {households.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{h.building || '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{h.roomNumber}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">
                        {h.ownerName || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{h.phoneNumber || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {h.type === ApartmentType.PENTHOUSE ? 'Penthouse' : h.type === ApartmentType.KIOT ? 'Kiot' : h.type === ApartmentType.OFFICE ? 'Văn phòng' : 'Căn hộ'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {h.status === ApartmentStatus.EMPTY ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Trống</span>
                      ) : h.status === ApartmentStatus.MAINTENANCE ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Bảo trì</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Có người ở</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenMembers(h)}
                        title="Quản lý nhân khẩu"
                        className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(h)}
                        title="Sửa thông tin hộ"
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => initiateDeleteHousehold(h.id)}
                        title="Xóa hộ"
                        className="text-red-600 hover:text-red-800 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {households.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      Không tìm thấy dữ liệu phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form (Add/Edit Household) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingId ? 'Sửa thông tin hộ khẩu' : 'Thêm hộ khẩu mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tòa nhà</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="A1, B2..."
                    value={formData.building || ''}
                    onChange={e => setFormData({ ...formData, building: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tầng</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.floor || ''}
                    onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })}
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
                    onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, area: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại căn hộ</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.type || ApartmentType.NORMAL}
                    onChange={e => setFormData({ ...formData, type: e.target.value as ApartmentType })}
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
                    onChange={e => setFormData({ ...formData, status: e.target.value as ApartmentStatus })}
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
                    onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Member List Management */}
      {isMemberModalOpen && selectedHousehold && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Quản lý nhân khẩu</h2>
                <p className="text-sm text-gray-500">
                  Căn hộ: {selectedHousehold.roomNumber} -
                  Chủ hộ: {selectedHousehold.ownerName || 'N/A'} -
                  SĐT: {selectedHousehold.phoneNumber || 'N/A'}
                </p>
              </div>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-6">
              {loadingMembers ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày sinh</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quan hệ</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CCCD</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã cư dân</th>
                      <th className="px-3 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {householdMembers.map(m => (
                      <tr key={m.id}>
                        <td className="px-3 py-2 text-sm text-gray-900 font-medium">{m.fullName}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{m.dateOfBirth}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{m.relationToOwner}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{m.phoneNumber || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{m.cccd || '-'}</td>
                        <td className="px-3 py-2 text-sm font-mono text-blue-600">{m.residentCode}</td>
                        <td className="px-3 py-2 text-right flex items-center justify-end gap-1">
                          <button onClick={() => initiateEditMember(m)} className="text-blue-500 hover:text-blue-700 p-1">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => initiateDeleteMember(m.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {householdMembers.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-4 text-gray-400">Chưa có thành viên nào</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <Plus className="w-4 h-4 mr-1" /> Thêm thành viên mới
              </h3>
              <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <input
                  placeholder="Họ và tên *"
                  required
                  className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={memberFormData.fullName}
                  onChange={e => setMemberFormData({ ...memberFormData, fullName: e.target.value })}
                />
                <input
                  type="date"
                  required
                  className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={memberFormData.dateOfBirth}
                  onChange={e => setMemberFormData({ ...memberFormData, dateOfBirth: e.target.value })}
                />
                <select
                  className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                  value={memberFormData.relationToOwner}
                  onChange={e => setMemberFormData({ ...memberFormData, relationToOwner: e.target.value })}
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
                  value={memberFormData.phoneNumber}
                  onChange={e => setMemberFormData({ ...memberFormData, phoneNumber: e.target.value })}
                />
                <input
                  placeholder="CCCD/CMND"
                  className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={memberFormData.cccd}
                  onChange={e => setMemberFormData({ ...memberFormData, cccd: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email liên hệ"
                  className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={memberFormData.email}
                  onChange={e => setMemberFormData({ ...memberFormData, email: e.target.value })}
                />
                <select
                  className="px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={memberFormData.status}
                  onChange={e => setMemberFormData({ ...memberFormData, status: e.target.value })}
                >
                  <option value="THUONG_TRU">Thường trú</option>
                  <option value="TAM_TRU">Tạm trú</option>
                  <option value="TAM_VANG">Tạm vắng</option>
                </select>

                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-right mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center"><Key className="w-3 h-3 mr-1" /> Mã cư dân tự động</span>
                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-300"
                  >
                    {isAddingMember ? 'Đang thêm...' : 'Thêm vào hộ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Update Member */}
      {isEditMemberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[55] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Sửa thông tin nhân khẩu</h2>
              <button onClick={() => setIsEditMemberModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editMemberFormData.fullName}
                    onChange={e => setEditMemberFormData({ ...editMemberFormData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editMemberFormData.dateOfBirth}
                    onChange={e => setEditMemberFormData({ ...editMemberFormData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quan hệ với chủ hộ</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editMemberFormData.relationToOwner}
                    onChange={e => setEditMemberFormData({ ...editMemberFormData, relationToOwner: e.target.value })}
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
                    value={editMemberFormData.status}
                    onChange={e => setEditMemberFormData({ ...editMemberFormData, status: e.target.value })}
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
                    value={editMemberFormData.phoneNumber}
                    onChange={e => setEditMemberFormData({ ...editMemberFormData, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CCCD/CMND</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editMemberFormData.cccd}
                    onChange={e => setEditMemberFormData({ ...editMemberFormData, cccd: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editMemberFormData.email || ''}
                  onChange={e => setEditMemberFormData({ ...editMemberFormData, email: e.target.value })}
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
                  value={editMemberFormData.newRoomNumber}
                  onChange={e => setEditMemberFormData({ ...editMemberFormData, newRoomNumber: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Nếu nhập số phòng mới, cư dân sẽ bị xóa khỏi hộ hiện tại và chuyển sang hộ mới.
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditMemberModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingMember}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdatingMember ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">{deleteConfirmation.title}</h3>
            <p className="text-sm text-center text-gray-500 mb-6">{deleteConfirmation.message}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HouseholdManager;
