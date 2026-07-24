import React, { useState, useEffect, useRef } from 'react';
import { getRegistrations, approveRegistration, createRegistration, updateRegistration, deleteRegistration } from '../../../../lib/registrationService';
import { getAllResidents, getHouseholds } from '../../../../lib/householdService';
import {
  Search, Filter, Loader2, RefreshCcw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, MapPin, X, Plus, AlertTriangle, User, Home, Calendar, Info, Save, ChevronDown, FilterX, Trash2, Edit2
} from 'lucide-react';
import { Household, Registration, RegistrationStatus, RegistrationType, ResidentInfo } from '@/src/lib/types';

const RegistrationManager: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [residents, setResidents] = useState<ResidentInfo[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);

  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [isResidentDropdownOpen, setIsResidentDropdownOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<ResidentInfo | null>(null);
  const residentDropdownRef = useRef<HTMLDivElement>(null);

  const [formType, setFormType] = useState<RegistrationType>(RegistrationType.TAM_VANG);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');

  const [actionRegistration, setActionRegistration] = useState<{ id: number; status: RegistrationStatus } | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (residentDropdownRef.current && !residentDropdownRef.current.contains(event.target as Node)) {
        setIsResidentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await getRegistrations(page, size, searchTerm, typeFilter, statusFilter);
      setRegistrations(data.content);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [page, size, statusFilter, typeFilter]);

  const handleTypeFilterChange = (val: string) => {
    setTypeFilter(val);
    setPage(0);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(0);
  };

  const loadCreationData = async () => {
    setIsLoadingData(true);
    try {
      const [resData, houseData] = await Promise.all([
        getAllResidents(0, 2000),
        getHouseholds()
      ]);
      setResidents(resData.content);
      setHouseholds(houseData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleOpenCreate = () => {
    loadCreationData();
    setEditingId(null);
    setSelectedResident(null);
    setResidentSearchQuery('');
    setFormReason('');
    setFormStartDate('');
    setFormEndDate('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reg: Registration) => {
    loadCreationData();
    setEditingId(reg.id);
    const res = residents.find(r => r.id === reg.residentId);
    if (res) {
      setSelectedResident(res);
    } else {
      setSelectedResident({ id: reg.residentId, name: reg.residentName, roomNumber: reg.roomNumber } as any);
    }
    setFormType(reg.type);
    setFormStartDate(reg.startDate);
    setFormEndDate(reg.endDate);
    setFormReason(reg.reason);
    setIsModalOpen(true);
  };

  const filteredResidents = residents.filter(r => {
    const query = residentSearchQuery.toLowerCase();
    return r.name.toLowerCase().includes(query) || r.roomNumber.toLowerCase().includes(query);
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;

    const house = households.find(h => h.roomNumber === selectedResident.roomNumber);
    if (!house) {
      alert("Không tìm thấy thông tin căn hộ cho cư dân này.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        residentId: Number(selectedResident.id),
        houseId: Number(house.id),
        type: formType,
        startDate: formStartDate,
        endDate: formEndDate,
        reason: formReason,
        note: editingId ? undefined : "Được tạo bởi Admin"
      };

      if (editingId) {
        await updateRegistration(editingId, payload);
        alert('Cập nhật thông tin thành công!');
      } else {
        await createRegistration(payload);
        alert('Đã tạo đăng ký thành công!');
      }

      setIsModalOpen(false);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!actionRegistration) return;
    try {
      const isApproved = actionRegistration.status === RegistrationStatus.APPROVED;
      const responseMessage = await approveRegistration(actionRegistration.id, isApproved, adminNote);
      alert(responseMessage);
      setActionRegistration(null);
      setAdminNote('');
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message);
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

  const getStatusStyle = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case RegistrationStatus.APPROVED: return 'bg-green-100 text-green-800';
      case RegistrationStatus.REJECTED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Tạm trú & Tạm vắng</h1>
          <p className="text-sm text-gray-500 font-medium">Theo dõi và phê duyệt thông tin cư trú của cư dân</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Đăng ký hộ cư dân
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc số phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPage(0)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>

        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          value={typeFilter}
          onChange={(e) => handleTypeFilterChange(e.target.value)}
        >
          <option value="">Tất cả loại hình</option>
          <option value="TAM_TRU">Tạm trú</option>
          <option value="TAM_VANG">Tạm vắng</option>
        </select>

        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>

        {(typeFilter || statusFilter || searchTerm) && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
          >
            <FilterX className="w-4 h-4" /> Xóa lọc
          </button>
        )}

        <button onClick={() => fetchRegistrations()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-blue-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Cư dân</th>
                    <th className="px-6 py-4">Phòng</th>
                    <th className="px-6 py-4">Loại hình</th>
                    <th className="px-6 py-4">Lý do</th>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{reg.residentName}</div>
                        <div className="text-[10px] text-gray-400 font-mono italic">ID: #{reg.id}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">{reg.roomNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide border ${reg.type === RegistrationType.TAM_TRU ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-orange-200 text-orange-700 bg-orange-50'}`}>
                          {reg.type === RegistrationType.TAM_TRU ? 'TẠM TRÚ' : 'TẠM VẮNG'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 max-w-[150px] truncate leading-relaxed" title={reg.reason}>
                          {reg.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-gray-700">
                          {new Date(reg.startDate).toLocaleDateString('vi-VN')} - {new Date(reg.endDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusStyle(reg.status)}`}>
                          {reg.status === RegistrationStatus.PENDING ? 'Chờ duyệt' :
                            reg.status === RegistrationStatus.APPROVED ? 'Đã duyệt' : 'Từ chối'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {reg.status === RegistrationStatus.PENDING && (
                            <>
                              <button
                                onClick={() => setActionRegistration({ id: reg.id, status: RegistrationStatus.APPROVED })}
                                className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 border border-green-200 transition-colors" title="Duyệt">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setActionRegistration({ id: reg.id, status: RegistrationStatus.REJECTED })}
                                className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200 transition-colors" title="Từ chối">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleOpenEdit(reg)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200 transition-colors" title="Sửa thông tin">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(reg.id)}
                            className="p-1.5 bg-gray-50 text-gray-400 rounded hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-colors" title="Xóa bản ghi">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {registrations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <FilterX className="w-10 h-10 mb-2 opacity-20" />
                          <p className="font-bold italic">Không tìm thấy dữ liệu đăng ký phù hợp</p>
                          <button onClick={handleClearFilters} className="text-blue-600 text-xs mt-2 font-bold hover:underline">Xóa tất cả bộ lọc</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-500">Trang <b>{page + 1}</b> / {totalPages}</span>
                <div className="flex space-x-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 border rounded-lg disabled:opacity-50 hover:bg-white bg-white shadow-sm transition-all"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                  <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-2 border rounded-lg disabled:opacity-50 hover:bg-white bg-white shadow-sm transition-all"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {actionRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${actionRegistration.status === RegistrationStatus.APPROVED ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {actionRegistration.status === RegistrationStatus.APPROVED ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {actionRegistration.status === RegistrationStatus.APPROVED ? 'Xác nhận phê duyệt?' : 'Xác nhận từ chối?'}
            </h3>
            <textarea
              placeholder="Ghi chú phản hồi cho cư dân..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400 shadow-sm"
              rows={3}
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setActionRegistration(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors">Hủy</button>
              <button
                onClick={handleUpdateStatus}
                className={`flex-1 py-2 text-white rounded-lg font-bold shadow-md transition-all active:scale-95 ${actionRegistration.status === RegistrationStatus.APPROVED ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa?</h3>
            <p className="text-sm text-gray-500 mb-6">Bạn có chắc chắn muốn xóa bản đăng ký này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Hủy</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md">Xóa ngay</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center"><MapPin className="w-5 h-5 mr-2 text-blue-600" /> {editingId ? 'Cập nhật đăng ký' : 'Đăng ký hộ cư dân'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Cư dân đăng ký</label>
                  <div className="relative" ref={residentDropdownRef}>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
                        {isLoadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                      </div>
                      <input
                        type="text"
                        placeholder={selectedResident ? `${selectedResident.name} - P.${selectedResident.roomNumber}` : "Tìm theo tên hoặc số phòng..."}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-bold placeholder:text-gray-400"
                        value={residentSearchQuery}
                        onChange={(e) => {
                          setResidentSearchQuery(e.target.value);
                          setIsResidentDropdownOpen(true);
                        }}
                        onFocus={() => setIsResidentDropdownOpen(true)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isResidentDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isResidentDropdownOpen && (
                      <div className="absolute z-[100] mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {filteredResidents.length > 0 ? (
                          filteredResidents.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between border-b last:border-0 border-gray-50 transition-colors ${selectedResident?.id === r.id ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                setSelectedResident(r);
                                setResidentSearchQuery('');
                                setIsResidentDropdownOpen(false);
                              }}
                            >
                              <div>
                                <p className="font-bold text-gray-900">{r.name}</p>
                                <p className="text-xs text-gray-500 font-medium">{r.relationship} • CCCD: {r.cccd || 'N/A'}</p>
                              </div>
                              <span className="px-2 py-1 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded-lg">
                                P.{r.roomNumber}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-400 italic">
                            <p className="text-sm font-bold">Không tìm thấy cư dân</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Loại hình</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-bold"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as RegistrationType)}
                    >
                      <option value="TAM_TRU">Tạm trú</option>
                      <option value="TAM_VANG">Tạm vắng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Trạng thái</label>
                    <div className="px-3 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4" /> {editingId ? 'Đang chỉnh sửa' : 'Hệ thống tự duyệt'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Ngày bắt đầu</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="date" required className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white font-bold" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Ngày kết thúc</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input type="date" required className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white font-bold" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Lý do đăng ký</label>
                  <textarea
                    required
                    placeholder="Nhập lý do vắng mặt hoặc lưu trú..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400 font-medium"
                    rows={3}
                    value={formReason}
                    onChange={e => setFormReason(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedResident}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {editingId ? 'Cập nhật đăng ký' : 'Hoàn tất tạo đăng ký'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationManager;
