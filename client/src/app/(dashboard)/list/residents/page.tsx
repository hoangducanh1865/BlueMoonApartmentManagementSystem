import React, { useState, useEffect } from 'react';
import { getAllResidents, mapRelationship, updateHouseholdMember, deleteResident } from '../../../../lib/householdService';
import { ResidentInfo, ResidentMember } from '@/src/lib/types';
import { Search, Loader2, RefreshCcw, ChevronLeft, ChevronRight, User, Edit2, X, Save, Trash2, AlertTriangle } from 'lucide-react';

const ResidentManager: React.FC = () => {
  const [residents, setResidents] = useState<ResidentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ResidentMember>>({
    fullName: '',
    dateOfBirth: '',
    relationToOwner: '',
    cccd: '',
    phoneNumber: '',
    status: 'THUONG_TRU'
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchResidents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllResidents(page, size, debouncedSearch);
      setResidents(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách cư dân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [page, size, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const initiateEdit = (resident: ResidentInfo) => {
    setEditingResidentId(String(resident.id));
    setEditFormData({
      fullName: resident.name,
      dateOfBirth: resident.dob || '',
      relationToOwner: resident.relationship,
      cccd: resident.cccd || '',
      phoneNumber: resident.phoneNumber || '',
      status: resident.status || 'THUONG_TRU'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResidentId) return;

    setIsUpdating(true);
    try {
      await updateHouseholdMember(editingResidentId, editFormData);
      alert('Cập nhật thông tin cư dân thành công!');
      setIsEditModalOpen(false);
      fetchResidents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const initiateDelete = (resident: ResidentInfo) => {
    setDeleteConfirmation({
      isOpen: true,
      id: String(resident.id),
      name: resident.name
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      const message = await deleteResident(deleteConfirmation.id);
      alert(message);
      setDeleteConfirmation(null);
      if (residents.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        fetchResidents();
      }
    } catch (err: any) {
      alert(err.message);
      setDeleteConfirmation(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Danh sách cư dân toàn khu</h1>
        <div className="text-sm text-gray-500">
          Tổng số: <span className="font-bold text-blue-600">{totalElements}</span> cư dân
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm theo tên cư dân..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={fetchResidents} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Tải lại">
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Mã cư dân</th>
                    <th className="px-6 py-4">Họ và tên</th>
                    <th className="px-6 py-4">Căn hộ</th>
                    <th className="px-6 py-4">Ngày sinh</th>
                    <th className="px-6 py-4">Quan hệ</th>
                    <th className="px-6 py-4">SĐT</th>
                    <th className="px-6 py-4">CCCD</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {residents.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-blue-600 font-medium">
                        {r.residentCode || r.id}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-full mr-3">
                          <User className="w-4 h-4" />
                        </div>
                        {r.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-gray-800 font-medium">
                          {r.building ? `${r.building} - ` : ''}{r.roomNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {r.dob ? new Date(r.dob).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${r.isHost ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {mapRelationship(r.relationship, r.isHost)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono">{r.phoneNumber || '-'}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono">{r.cccd || '-'}</td>
                      <td className="px-6 py-4">
                        {r.status === 'THUONG_TRU' ? (
                          <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded">Thường trú</span>
                        ) : r.status === 'TAM_TRU' ? (
                          <span className="text-yellow-600 text-xs font-semibold bg-yellow-50 px-2 py-1 rounded">Tạm trú</span>
                        ) : r.status === 'TAM_VANG' ? (
                          <span className="text-gray-600 text-xs font-semibold bg-gray-100 px-2 py-1 rounded">Tạm vắng</span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Không rõ</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end">
                        <button
                          onClick={() => initiateEdit(r)}
                          title="Sửa thông tin"
                          className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => initiateDelete(r)}
                          title="Xóa cư dân"
                          className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {residents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                        Không tìm thấy cư dân nào phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="text-sm text-gray-500">
                  Hiển thị trang <span className="font-medium">{page + 1}</span> / <span className="font-medium">{totalPages}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages - 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Sửa thông tin cư dân</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editFormData.fullName}
                    onChange={e => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editFormData.dateOfBirth}
                    onChange={e => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quan hệ với chủ hộ</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editFormData.relationToOwner}
                    onChange={e => setEditFormData({ ...editFormData, relationToOwner: e.target.value })}
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
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
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
                    value={editFormData.phoneNumber}
                    onChange={e => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CCCD/CMND</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editFormData.cccd}
                    onChange={e => setEditFormData({ ...editFormData, cccd: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Xóa cư dân?</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              Bạn có chắc chắn muốn xóa cư dân <b>{deleteConfirmation.name}</b>?
              Hành động này không thể hoàn tác.
            </p>
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

export default ResidentManager;
