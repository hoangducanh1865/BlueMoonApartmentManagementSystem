import React, { useState, useEffect } from 'react';
import {
  getInvoices,
  createInvoice,
  getInvoiceById,
  deleteInvoice,
  updateInvoiceDetailQuantity,
  updateInvoiceDueDate,
  CreateInvoiceItem
} from '../../../../lib/invoiceService';
import { getHouseholds } from '../../../../lib/householdService';
import { getAllFeeDefinitions } from '../../../../lib/feeService';
import {
  Plus, Search, Loader2, RefreshCcw, FileText, ChevronLeft, ChevronRight,
  X, Filter, CheckCircle, Clock, Info, Banknote, Eye, Printer, Trash2, AlertTriangle, Home, User, Phone, Ruler, Building, Edit2, Check, Save
} from 'lucide-react';
import { ApartmentStatus, FeeDefinition, Household, Invoice } from '@/src/lib/types';

const InvoiceManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & Search
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [feeDefinitions, setFeeDefinitions] = useState<FeeDefinition[]>([]);

  const [formHouseId, setFormHouseId] = useState('');
  const [formMonth, setFormMonth] = useState(new Date().getMonth() + 1);
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formDueDate, setFormDueDate] = useState('');
  const [formItems, setFormItems] = useState<CreateInvoiceItem[]>([]);

  // Detail Modal State
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [tempDueDate, setTempDueDate] = useState('');
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(0);
  const [isUpdatingDetail, setIsUpdatingDetail] = useState(false);

  // Household Detail State
  const [viewingHousehold, setViewingHousehold] = useState<Household | null>(null);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoices(page, size, searchTerm, statusFilter);
      setInvoices(data.content);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, size, statusFilter]);

  // Load households once for lookups
  useEffect(() => {
    const initHouseholds = async () => {
      try {
        const data = await getHouseholds();
        setHouseholds(data);
      } catch (err) {
        console.error("Failed to pre-load households", err);
      }
    };
    initHouseholds();
  }, []);

  // Effect to sync quantities when household changes
  useEffect(() => {
    if (!formHouseId || households.length === 0) return;

    const selectedHouse = households.find(h => String(h.id) === String(formHouseId));
    if (selectedHouse && selectedHouse.area) {
      setFormItems(prevItems => prevItems.map(item => {
        const fd = feeDefinitions.find(f => f.id === item.feeId);
        if (fd && fd.unit.toLowerCase() === 'm2') {
          return { ...item, quantity: selectedHouse.area };
        }
        return item;
      }));
    }
  }, [formHouseId, households, feeDefinitions]);

  // Update due date automatically in creation modal
  useEffect(() => {
    if (isModalOpen) {
      const lastDay = new Date(formYear, formMonth, 0);
      const formatted = lastDay.toISOString().split('T')[0];
      setFormDueDate(formatted);
    }
  }, [formMonth, formYear, isModalOpen]);

  const loadCreationData = async () => {
    try {
      const fData = await getAllFeeDefinitions();
      setFeeDefinitions(fData);

      const mandatoryItems = fData
        .filter(f => f.isMandatory)
        .map(f => ({ feeId: f.id, quantity: 1 }));
      setFormItems(mandatoryItems);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    setFormMonth(currentMonth);
    setFormYear(currentYear);
    const lastDay = new Date(currentYear, currentMonth, 0);
    setFormDueDate(lastDay.toISOString().split('T')[0]);
    setModalError('');
    loadCreationData();
    setIsModalOpen(true);
  };

  const handleViewDetail = async (id: number) => {
    setLoadingDetail(true);
    setEditingDueDate(false);
    setEditingDetailId(null);
    try {
      const fullInvoice = await getInvoiceById(id);
      setViewingInvoice(fullInvoice);
      setTempDueDate(fullInvoice.dueDate);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateDueDate = async () => {
    if (!viewingInvoice) return;
    setIsUpdatingDetail(true);
    try {
      await updateInvoiceDueDate(viewingInvoice.id, tempDueDate);
      const updated = await getInvoiceById(viewingInvoice.id);
      setViewingInvoice(updated);
      setEditingDueDate(false);
      fetchInvoices(); // Refresh main list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingDetail(false);
    }
  };

  const handleUpdateQuantity = async (detailId: number) => {
    if (!viewingInvoice) return;
    setIsUpdatingDetail(true);
    try {
      await updateInvoiceDetailQuantity(detailId, tempQuantity);
      // Refresh the full invoice to see new total amount and calculated detail amount
      const updated = await getInvoiceById(viewingInvoice.id);
      setViewingInvoice(updated);
      setEditingDetailId(null);
      fetchInvoices(); // Refresh main list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingDetail(false);
    }
  };

  const handleViewHouseholdByRoom = (roomNumber: string) => {
    const house = households.find(h => h.roomNumber === roomNumber);
    if (house) {
      setViewingHousehold(house);
    } else {
      alert(`Không tìm thấy thông tin cho phòng ${roomNumber}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const msg = await deleteInvoice(deleteConfirm.id);
      alert(msg);
      setDeleteConfirm(null);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddItem = (feeId: number) => {
    if (formItems.find(i => i.feeId === feeId)) return;
    const fd = feeDefinitions.find(f => f.id === feeId);
    let quantity = 1;
    if (fd && fd.unit.toLowerCase() === 'm2' && formHouseId) {
      const selectedHouse = households.find(h => String(h.id) === String(formHouseId));
      if (selectedHouse && selectedHouse.area) {
        quantity = selectedHouse.area;
      }
    }
    setFormItems([...formItems, { feeId, quantity }]);
  };

  const handleRemoveItem = (feeId: number) => {
    setFormItems(formItems.filter(i => i.feeId !== feeId));
  };

  const handleQuantityChange = (feeId: number, qty: number) => {
    setFormItems(formItems.map(i => i.feeId === feeId ? { ...i, quantity: qty } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!formHouseId || formItems.length === 0) {
      setModalError('Vui lòng chọn căn hộ và ít nhất một khoản phí');
      return;
    }
    setIsSubmitting(true);
    try {
      await createInvoice({
        houseId: formHouseId,
        month: formMonth,
        year: formYear,
        dueDate: formDueDate,
        items: formItems
      });
      alert('Tạo hóa đơn thành công!');
      setIsModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      setModalError(err.message || 'Có lỗi xảy ra khi phát hành hóa đơn');
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý hóa đơn</h1>
          <p className="text-sm text-gray-500">Xem và phát hành hóa đơn cho các hộ dân</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Phát hành hóa đơn mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm theo số phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="unpaid">Chưa thanh toán</option>
          <option value="paid">Đã thanh toán</option>
        </select>

        <button onClick={fetchInvoices} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Hóa đơn</th>
                    <th className="px-6 py-4">Phòng</th>
                    <th className="px-6 py-4">Kỳ hạn</th>
                    <th className="px-6 py-4 text-right">Tổng tiền</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-blue-500" />
                          {inv.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewHouseholdByRoom(inv.roomNumber)}
                          className="font-mono font-bold text-blue-600 hover:underline"
                        >
                          {inv.roomNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(inv.dueDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        {inv.status === 'paid' ? (
                          <span className="flex items-center text-green-600 font-semibold bg-green-50 px-2 py-1 rounded w-fit">
                            <CheckCircle className="w-3 h-3 mr-1" /> Đã đóng
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-600 font-semibold bg-yellow-50 px-2 py-1 rounded w-fit">
                            <Clock className="w-3 h-3 mr-1" /> Chưa đóng
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(inv.id)}
                            title="Xem chi tiết"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: inv.id, title: inv.title })}
                            title="Xóa hóa đơn"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                        Không tìm thấy hóa đơn nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-500">Trang {page + 1} / {totalPages}</span>
                <div className="flex space-x-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 border rounded-lg hover:bg-white disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    disabled={page === totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 border rounded-lg hover:bg-white disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{viewingInvoice.title}</h2>
                <p className="text-sm text-gray-500 font-medium">
                  Số phòng:
                  <button
                    onClick={() => handleViewHouseholdByRoom(viewingInvoice.roomNumber)}
                    className="text-blue-600 hover:underline font-bold ml-1"
                  >
                    {viewingInvoice.roomNumber}
                  </button>
                </p>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Trạng thái:</span>
                {viewingInvoice.status === 'paid' ? (
                  <span className="text-green-600 font-bold uppercase tracking-wide">Đã thanh toán</span>
                ) : (
                  <span className="text-red-600 font-bold uppercase tracking-wide">Chưa thanh toán</span>
                )}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Hạn chót:</span>
                {editingDueDate ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="px-2 py-1 border rounded text-sm bg-gray-800 text-white"
                      value={tempDueDate}
                      onChange={e => setTempDueDate(e.target.value)}
                    />
                    <button
                      onClick={handleUpdateDueDate}
                      disabled={isUpdatingDetail}
                      className="text-green-600 hover:text-green-800"
                    >
                      {isUpdatingDetail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setEditingDueDate(false)} className="text-red-500">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center group">
                    <span className="font-semibold text-gray-900">{new Date(viewingInvoice.dueDate).toLocaleDateString('vi-VN')}</span>
                    {viewingInvoice.status === 'unpaid' && (
                      <button
                        onClick={() => { setTempDueDate(viewingInvoice.dueDate); setEditingDueDate(true); }}
                        className="ml-2 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Nội dung</th>
                      <th className="px-4 py-3 text-right font-bold">Đơn giá</th>
                      <th className="px-4 py-3 text-center font-bold">SL</th>
                      <th className="px-4 py-3 text-right font-bold">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {viewingInvoice.details?.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3 text-gray-900 font-medium">{d.feeName}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(d.unitPrice)}</td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {editingDetailId === d.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.1"
                                autoFocus
                                className="w-16 px-1 py-0.5 bg-gray-800 text-white border-gray-700 rounded text-center text-xs outline-none"
                                value={tempQuantity}
                                onChange={e => setTempQuantity(Number(e.target.value))}
                                onKeyDown={e => e.key === 'Enter' && handleUpdateQuantity(d.id)}
                              />
                              <button onClick={() => handleUpdateQuantity(d.id)} className="text-green-600">
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <span>{d.quantity} {d.unit}</span>
                              {viewingInvoice.status === 'unpaid' && (
                                <button
                                  onClick={() => { setEditingDetailId(d.id); setTempQuantity(d.quantity); }}
                                  className="ml-1 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50 border-t-2 border-blue-100">
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-right font-bold text-gray-800">Tổng cộng:</td>
                      <td className="px-4 py-4 text-right text-xl font-black text-blue-700">{formatCurrency(viewingInvoice.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors">
                <Printer className="w-4 h-4 mr-2" /> In hóa đơn
              </button>
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Household Info Modal */}
      {viewingHousehold && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin hộ dân</h2>
                  <p className="text-gray-500 font-medium">Căn hộ {viewingHousehold.roomNumber}</p>
                </div>
              </div>
              <button onClick={() => setViewingHousehold(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <User className="w-10 h-10 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Chủ hộ</p>
                  <p className="text-lg font-bold text-gray-800">{viewingHousehold.ownerName || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500 uppercase font-bold">SĐT liên hệ</p>
                  </div>
                  <p className="text-base font-semibold text-gray-800">{viewingHousehold.phoneNumber || '---'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Ruler className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500 uppercase font-bold">Diện tích</p>
                  </div>
                  <p className="text-base font-semibold text-gray-800">{viewingHousehold.area} m²</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500 uppercase font-bold">Vị trí</p>
                  </div>
                  <p className="text-base font-semibold text-gray-800">Tòa {viewingHousehold.building || '-'} / Tầng {viewingHousehold.floor || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500 uppercase font-bold">Trạng thái</p>
                  </div>
                  <p className="text-base font-semibold text-gray-800">
                    {viewingHousehold.status === ApartmentStatus.EMPTY ? 'Trống' :
                      viewingHousehold.status === ApartmentStatus.OCCUPIED ? 'Đang ở' : 'Bảo trì'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewingHousehold(null)}
              className="w-full mt-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Đóng thông tin
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa hóa đơn?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Bạn có chắc chắn muốn xóa <b>{deleteConfirm.title}</b>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Phát hành hóa đơn</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {modalError && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center text-sm rounded">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Căn hộ</label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-gray-800 text-white border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formHouseId}
                    onChange={e => setFormHouseId(e.target.value)}
                  >
                    <option value="">Chọn căn hộ...</option>
                    {households.map(h => (
                      <option key={h.id} value={h.id}>P.{h.roomNumber} - {h.ownerName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
                    <input type="number" min="1" max="12" className="w-full px-3 py-2 bg-gray-800 text-white border-gray-700 rounded-lg" value={formMonth} onChange={e => setFormMonth(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
                    <input type="number" className="w-full px-3 py-2 bg-gray-800 text-white border-gray-700 rounded-lg" value={formYear} onChange={e => setFormYear(Number(e.target.value))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hạn đóng</label>
                  <input type="date" className="w-full px-3 py-2 bg-gray-800 text-white border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Chi tiết khoản phí</span>
                  <div className="flex gap-2">
                    <select
                      className="text-sm border rounded px-2 py-1"
                      onChange={(e) => e.target.value && handleAddItem(Number(e.target.value))}
                      value=""
                    >
                      <option value="">+ Thêm loại phí...</option>
                      {feeDefinitions.map(fd => (
                        <option key={fd.id} value={fd.id}>{fd.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left">Tên khoản phí</th>
                      <th className="px-4 py-2 text-left">Đơn giá</th>
                      <th className="px-4 py-2 text-center">Số lượng</th>
                      <th className="px-4 py-2 text-right">Thành tiền</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formItems.map(item => {
                      const fd = feeDefinitions.find(f => f.id === item.feeId);
                      if (!fd) return null;
                      return (
                        <tr key={item.feeId}>
                          <td className="px-4 py-3 font-medium text-gray-800">{fd.name}</td>
                          <td className="px-4 py-3 text-gray-500">{formatCurrency(fd.unitPrice)} / {fd.unit}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              className="w-20 mx-auto block px-2 py-1 border rounded text-center"
                              value={item.quantity}
                              onChange={e => handleQuantityChange(item.feeId, Number(e.target.value))}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-700">
                            {formatCurrency(fd.unitPrice * item.quantity)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!fd.isMandatory && (
                              <button type="button" onClick={() => handleRemoveItem(item.feeId)} className="text-red-500 hover:text-red-700">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {formItems.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Vui lòng thêm ít nhất một khoản phí</td></tr>
                    )}
                  </tbody>
                  <tfoot className="bg-blue-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-bold text-blue-800">Tổng cộng:</td>
                      <td className="px-4 py-3 text-right font-bold text-xl text-blue-900">
                        {formatCurrency(formItems.reduce((acc, item) => {
                          const fd = feeDefinitions.find(f => f.id === item.feeId);
                          return acc + (fd ? fd.unitPrice * item.quantity : 0);
                        }, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Hủy</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 flex items-center transition-all active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                  Xác nhận phát hành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager;
