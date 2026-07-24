import React, { useState, useEffect } from 'react';
import {
    getVehicleRegistrations,
    approveVehicleRegistration,
    deleteVehicleRegistration,
    createVehicleRegistration
} from '../../../../lib/parkingService';
import { getHouseholds } from '../../../../lib/householdService';
import {
    Search, Filter, Loader2, RefreshCcw, ChevronLeft, ChevronRight,
    CheckCircle, XCircle, Clock, Car, X, Plus, AlertTriangle, User, Home,
    Calendar, Info, Save, ChevronDown, FilterX, Trash2, FileText, Eye,
    Bike, Zap
} from 'lucide-react';
import {
    VehicleRegistration,
    ParkingRegistrationStatus,
    VehicleType,
    Household
} from '@/src/lib/types';

const VehicleRegistrationManager: React.FC = () => {
    const [registrations, setRegistrations] = useState<VehicleRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [households, setHouseholds] = useState<Household[]>([]);
    const [formData, setFormData] = useState({
        vehicleType: VehicleType.MOTORBIKE,
        licensePlate: '',
        brand: '',
        model: '',
        color: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        householdId: '',
        documentUrl: '',
        notes: ''
    });

    // View Detail Modal
    const [viewRegistration, setViewRegistration] = useState<VehicleRegistration | null>(null);

    // Action Modal (approve/reject)
    const [actionRegistration, setActionRegistration] = useState<{
        id: number;
        action: 'approve' | 'reject';
    } | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    // Delete Confirm
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const statusParam = statusFilter as ParkingRegistrationStatus | undefined;
            const typeParam = typeFilter as VehicleType | undefined;
            const data = await getVehicleRegistrations(page, size, statusParam, typeParam);
            // Filter by search term on client side
            let filtered = data.content;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(
                    r =>
                        r.licensePlate.toLowerCase().includes(term) ||
                        r.ownerName.toLowerCase().includes(term) ||
                        (r.roomNumber && r.roomNumber.toLowerCase().includes(term))
                );
            }
            setRegistrations(filtered);
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

    const handleSearch = () => {
        setPage(0);
        fetchRegistrations();
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setTypeFilter('');
        setPage(0);
    };

    const loadHouseholds = async () => {
        try {
            const data = await getHouseholds();
            setHouseholds(data);
        } catch (err) {
            console.error('Failed to load households:', err);
        }
    };

    const handleOpenCreate = () => {
        loadHouseholds();
        setFormData({
            vehicleType: VehicleType.MOTORBIKE,
            licensePlate: '',
            brand: '',
            model: '',
            color: '',
            ownerName: '',
            ownerPhone: '',
            ownerEmail: '',
            householdId: '',
            documentUrl: '',
            notes: ''
        });
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createVehicleRegistration({
                vehicleType: formData.vehicleType,
                licensePlate: formData.licensePlate.toUpperCase(),
                brand: formData.brand || undefined,
                model: formData.model || undefined,
                color: formData.color || undefined,
                ownerName: formData.ownerName,
                ownerPhone: formData.ownerPhone,
                ownerEmail: formData.ownerEmail || undefined,
                householdId: formData.householdId ? parseInt(formData.householdId) : undefined,
                documentUrl: formData.documentUrl || undefined,
                notes: formData.notes || undefined
            });
            alert('Tạo đăng ký xe thành công!');
            setIsCreateModalOpen(false);
            fetchRegistrations();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveReject = async () => {
        if (!actionRegistration) return;
        try {
            const isApproved = actionRegistration.action === 'approve';
            await approveVehicleRegistration(actionRegistration.id, isApproved, adminNotes);
            alert(isApproved ? 'Đã duyệt đăng ký xe!' : 'Đã từ chối đăng ký xe!');
            setActionRegistration(null);
            setAdminNotes('');
            fetchRegistrations();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteVehicleRegistration(deleteConfirmId);
            alert('Đã xóa đăng ký!');
            setDeleteConfirmId(null);
            fetchRegistrations();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const getStatusStyle = (status: ParkingRegistrationStatus) => {
        switch (status) {
            case ParkingRegistrationStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800';
            case ParkingRegistrationStatus.APPROVED:
                return 'bg-green-100 text-green-800';
            case ParkingRegistrationStatus.REJECTED:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: ParkingRegistrationStatus) => {
        switch (status) {
            case ParkingRegistrationStatus.PENDING:
                return <Clock className="w-4 h-4" />;
            case ParkingRegistrationStatus.APPROVED:
                return <CheckCircle className="w-4 h-4" />;
            case ParkingRegistrationStatus.REJECTED:
                return <XCircle className="w-4 h-4" />;
            default:
                return null;
        }
    };

    const getStatusText = (status: ParkingRegistrationStatus) => {
        switch (status) {
            case ParkingRegistrationStatus.PENDING:
                return 'Chờ duyệt';
            case ParkingRegistrationStatus.APPROVED:
                return 'Đã duyệt';
            case ParkingRegistrationStatus.REJECTED:
                return 'Từ chối';
            default:
                return status;
        }
    };

    const getVehicleTypeIcon = (type: VehicleType) => {
        switch (type) {
            case VehicleType.CAR:
                return <Car className="w-4 h-4" />;
            case VehicleType.MOTORBIKE:
                return <Bike className="w-4 h-4" />;
            case VehicleType.BICYCLE:
                return <Bike className="w-4 h-4" />;
            case VehicleType.ELECTRIC_BIKE:
                return <Zap className="w-4 h-4" />;
            default:
                return <Car className="w-4 h-4" />;
        }
    };

    const getVehicleTypeText = (type: VehicleType) => {
        switch (type) {
            case VehicleType.CAR:
                return 'Ô tô';
            case VehicleType.MOTORBIKE:
                return 'Xe máy';
            case VehicleType.BICYCLE:
                return 'Xe đạp';
            case VehicleType.ELECTRIC_BIKE:
                return 'Xe đạp điện';
            default:
                return type;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Đăng ký Xe</h1>
                    <p className="text-sm text-gray-500 font-medium">
                        Xét duyệt đăng ký phương tiện của cư dân
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Tạo đăng ký mới
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm theo biển số, chủ xe, phòng..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                </div>

                <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={typeFilter}
                    onChange={e => {
                        setTypeFilter(e.target.value);
                        setPage(0);
                    }}
                >
                    <option value="">Tất cả loại xe</option>
                    <option value="CAR">Ô tô</option>
                    <option value="MOTORBIKE">Xe máy</option>
                    <option value="BICYCLE">Xe đạp</option>
                    <option value="ELECTRIC_BIKE">Xe đạp điện</option>
                </select>

                <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={statusFilter}
                    onChange={e => {
                        setStatusFilter(e.target.value);
                        setPage(0);
                    }}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="REJECTED">Từ chối</option>
                </select>

                {(typeFilter || statusFilter || searchTerm) && (
                    <button
                        onClick={handleClearFilters}
                        className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                    >
                        <FilterX className="w-4 h-4" /> Xóa lọc
                    </button>
                )}

                <button
                    onClick={() => fetchRegistrations()}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center text-blue-600">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Biển số</th>
                                        <th className="px-6 py-4">Loại xe</th>
                                        <th className="px-6 py-4">Chủ xe</th>
                                        <th className="px-6 py-4">Phòng</th>
                                        <th className="px-6 py-4">Ngày tạo</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {registrations.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                Không có đăng ký nào
                                            </td>
                                        </tr>
                                    ) : (
                                        registrations.map(reg => (
                                            <tr key={reg.id} className="hover:bg-gray-50 group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-blue-600 font-mono">
                                                        {reg.licensePlate}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono italic">
                                                        ID: #{reg.id}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getVehicleTypeIcon(reg.vehicleType)}
                                                        <span>{getVehicleTypeText(reg.vehicleType)}</span>
                                                    </div>
                                                    {reg.brand && (
                                                        <div className="text-xs text-gray-400">
                                                            {reg.brand} {reg.model}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{reg.ownerName}</div>
                                                    <div className="text-xs text-gray-400">{reg.ownerPhone}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-blue-600">
                                                    {reg.roomNumber || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">
                                                    {formatDate(reg.createdAt)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                                                            reg.status
                                                        )}`}
                                                    >
                                                        {getStatusIcon(reg.status)}
                                                        {getStatusText(reg.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setViewRegistration(reg)}
                                                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {reg.status === ParkingRegistrationStatus.PENDING && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        setActionRegistration({ id: reg.id, action: 'approve' })
                                                                    }
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                                    title="Duyệt"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setActionRegistration({ id: reg.id, action: 'reject' })
                                                                    }
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                                    title="Từ chối"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => setDeleteConfirmId(reg.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                            <p className="text-sm text-gray-500">
                                Trang {page + 1} / {totalPages || 1}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-800">Tạo Đăng ký Xe Mới</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Loại xe *
                                    </label>
                                    <select
                                        required
                                        value={formData.vehicleType}
                                        onChange={e =>
                                            setFormData({ ...formData, vehicleType: e.target.value as VehicleType })
                                        }
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="MOTORBIKE">Xe máy</option>
                                        <option value="CAR">Ô tô</option>
                                        <option value="BICYCLE">Xe đạp</option>
                                        <option value="ELECTRIC_BIKE">Xe đạp điện</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Biển số *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="VD: 29A-12345"
                                        value={formData.licensePlate}
                                        onChange={e =>
                                            setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
                                        }
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hãng xe</label>
                                    <input
                                        type="text"
                                        placeholder="VD: Honda"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dòng xe</label>
                                    <input
                                        type="text"
                                        placeholder="VD: Vision"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                                    <input
                                        type="text"
                                        placeholder="VD: Đen"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên chủ xe *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Họ và tên"
                                        value={formData.ownerName}
                                        onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại *
                                    </label>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="0912345678"
                                        value={formData.ownerPhone}
                                        onChange={e => setFormData({ ...formData, ownerPhone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={formData.ownerEmail}
                                        onChange={e => setFormData({ ...formData, ownerEmail: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Căn hộ</label>
                                    <select
                                        value={formData.householdId}
                                        onChange={e => setFormData({ ...formData, householdId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Chọn căn hộ --</option>
                                        {households.map(h => (
                                            <option key={h.id} value={h.id}>
                                                {h.roomNumber} - {h.ownerName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL Tài liệu (giấy đăng ký xe)
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/document.pdf"
                                    value={formData.documentUrl}
                                    onChange={e => setFormData({ ...formData, documentUrl: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                <textarea
                                    placeholder="Ghi chú thêm..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <Save className="w-4 h-4" />
                                    Tạo đăng ký
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {viewRegistration && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Chi tiết Đăng ký</h2>
                            <button
                                onClick={() => setViewRegistration(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-blue-50 rounded-full">
                                    {getVehicleTypeIcon(viewRegistration.vehicleType)}
                                </div>
                            </div>

                            <div className="text-center mb-4">
                                <div className="text-2xl font-bold font-mono text-blue-600">
                                    {viewRegistration.licensePlate}
                                </div>
                                <div className="text-gray-500">
                                    {getVehicleTypeText(viewRegistration.vehicleType)}
                                    {viewRegistration.brand && ` - ${viewRegistration.brand}`}
                                    {viewRegistration.model && ` ${viewRegistration.model}`}
                                </div>
                                {viewRegistration.color && (
                                    <div className="text-sm text-gray-400">Màu: {viewRegistration.color}</div>
                                )}
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-500">Chủ xe:</span>
                                    <span className="font-medium">{viewRegistration.ownerName}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-500">Điện thoại:</span>
                                    <span className="font-medium">{viewRegistration.ownerPhone}</span>
                                </div>
                                {viewRegistration.ownerEmail && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Email:</span>
                                        <span className="font-medium">{viewRegistration.ownerEmail}</span>
                                    </div>
                                )}
                                {viewRegistration.roomNumber && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Căn hộ:</span>
                                        <span className="font-medium font-mono">{viewRegistration.roomNumber}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-500">Trạng thái:</span>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(
                                            viewRegistration.status
                                        )}`}
                                    >
                                        {getStatusIcon(viewRegistration.status)}
                                        {getStatusText(viewRegistration.status)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-500">Ngày tạo:</span>
                                    <span className="font-medium">{formatDate(viewRegistration.createdAt)}</span>
                                </div>
                                {viewRegistration.processedAt && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Ngày xử lý:</span>
                                        <span className="font-medium">{formatDate(viewRegistration.processedAt)}</span>
                                    </div>
                                )}
                            </div>

                            {viewRegistration.documentUrl && (
                                <div className="pt-4">
                                    <a
                                        href={viewRegistration.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Xem tài liệu đính kèm
                                    </a>
                                </div>
                            )}

                            {viewRegistration.notes && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1">Ghi chú:</div>
                                    <div className="text-sm">{viewRegistration.notes}</div>
                                </div>
                            )}

                            {viewRegistration.adminNotes && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="text-xs text-blue-600 mb-1">Ghi chú Admin:</div>
                                    <div className="text-sm">{viewRegistration.adminNotes}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modal (Approve/Reject) */}
            {actionRegistration && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {actionRegistration.action === 'approve' ? 'Duyệt đăng ký' : 'Từ chối đăng ký'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">
                                {actionRegistration.action === 'approve'
                                    ? 'Xác nhận duyệt đăng ký xe này? Xe sẽ được thêm vào hệ thống.'
                                    : 'Xác nhận từ chối đăng ký xe này?'}
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ghi chú (tùy chọn)
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                    placeholder="Nhập ghi chú..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setActionRegistration(null);
                                        setAdminNotes('');
                                    }}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleApproveReject}
                                    className={`px-4 py-2 rounded-lg text-white ${actionRegistration.action === 'approve'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {actionRegistration.action === 'approve' ? 'Duyệt' : 'Từ chối'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc muốn xóa đăng ký này? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

export default VehicleRegistrationManager;
