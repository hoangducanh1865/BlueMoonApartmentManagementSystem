import React, { useState, useEffect } from 'react';
import {
    getVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getActiveSubscriptionByVehicle,
    createSubscription,
    cancelSubscription,
    getPricings
} from '../../../../lib/parkingService';
import { getHouseholds } from '../../../../lib/householdService';
import {
    Search, Loader2, RefreshCcw, ChevronLeft, ChevronRight,
    Car, X, Plus, AlertTriangle, Save, FilterX, Trash2, Edit2,
    Bike, Zap, CreditCard, Calendar, DollarSign
} from 'lucide-react';
import {
    Vehicle,
    VehicleType,
    Household,
    ParkingSubscription,
    SubscriptionType,
    ParkingPricing
} from '@/src/lib/types';

const VehicleManager: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Edit/Create Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [households, setHouseholds] = useState<Household[]>([]);

    const [formData, setFormData] = useState({
        licensePlate: '',
        vehicleType: VehicleType.MOTORBIKE,
        brand: '',
        model: '',
        color: '',
        ownerName: '',
        ownerPhone: '',
        householdId: ''
    });

    // Delete Confirm
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Subscription Modal
    const [subscriptionModal, setSubscriptionModal] = useState<{
        vehicle: Vehicle;
        subscription: ParkingSubscription | null;
    } | null>(null);
    const [pricings, setPricings] = useState<ParkingPricing[]>([]);
    const [subscriptionForm, setSubscriptionForm] = useState({
        subscriptionType: SubscriptionType.MONTHLY,
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const typeParam = typeFilter as VehicleType | undefined;
            const data = await getVehicles(page, size, searchTerm || undefined, typeParam);
            setVehicles(data.content);
            setTotalPages(data.totalPages);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, [page, size, typeFilter]);

    const handleSearch = () => {
        setPage(0);
        fetchVehicles();
    };

    const handleClearFilters = () => {
        setSearchTerm('');
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
        setEditingVehicle(null);
        setFormData({
            licensePlate: '',
            vehicleType: VehicleType.MOTORBIKE,
            brand: '',
            model: '',
            color: '',
            ownerName: '',
            ownerPhone: '',
            householdId: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (vehicle: Vehicle) => {
        loadHouseholds();
        setEditingVehicle(vehicle);
        setFormData({
            licensePlate: vehicle.licensePlate,
            vehicleType: vehicle.vehicleType,
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            color: vehicle.color || '',
            ownerName: vehicle.ownerName || '',
            ownerPhone: vehicle.ownerPhone || '',
            householdId: vehicle.householdId?.toString() || ''
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingVehicle) {
                await updateVehicle(editingVehicle.id, {
                    vehicleType: formData.vehicleType,
                    brand: formData.brand || undefined,
                    model: formData.model || undefined,
                    color: formData.color || undefined,
                    ownerName: formData.ownerName || undefined,
                    ownerPhone: formData.ownerPhone || undefined,
                    householdId: formData.householdId ? parseInt(formData.householdId) : undefined
                });
                alert('Cập nhật xe thành công!');
            } else {
                await createVehicle({
                    licensePlate: formData.licensePlate.toUpperCase(),
                    vehicleType: formData.vehicleType,
                    brand: formData.brand || undefined,
                    model: formData.model || undefined,
                    color: formData.color || undefined,
                    ownerName: formData.ownerName || undefined,
                    ownerPhone: formData.ownerPhone || undefined,
                    householdId: formData.householdId ? parseInt(formData.householdId) : undefined
                });
                alert('Thêm xe thành công!');
            }
            setIsModalOpen(false);
            fetchVehicles();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteVehicle(deleteConfirmId);
            alert('Đã xóa xe!');
            setDeleteConfirmId(null);
            fetchVehicles();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleOpenSubscription = async (vehicle: Vehicle) => {
        try {
            const [subscription, pricingData] = await Promise.all([
                getActiveSubscriptionByVehicle(vehicle.id),
                getPricings(vehicle.vehicleType, undefined, true)
            ]);
            setPricings(pricingData);
            setSubscriptionModal({ vehicle, subscription });

            // Calculate default end date based on subscription type
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            setSubscriptionForm({
                subscriptionType: SubscriptionType.MONTHLY,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleSubscriptionTypeChange = (type: SubscriptionType) => {
        const startDate = new Date(subscriptionForm.startDate);
        const endDate = new Date(startDate);

        switch (type) {
            case SubscriptionType.MONTHLY:
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case SubscriptionType.QUARTERLY:
                endDate.setMonth(endDate.getMonth() + 3);
                break;
            case SubscriptionType.YEARLY:
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
            default:
                endDate.setDate(endDate.getDate() + 1);
        }

        setSubscriptionForm({
            ...subscriptionForm,
            subscriptionType: type,
            endDate: endDate.toISOString().split('T')[0]
        });
    };

    const handleCreateSubscription = async () => {
        if (!subscriptionModal) return;

        const pricing = pricings.find(
            p => p.subscriptionType === subscriptionForm.subscriptionType
        );

        if (!pricing) {
            alert('Không tìm thấy bảng giá phù hợp!');
            return;
        }

        try {
            await createSubscription({
                vehicleId: subscriptionModal.vehicle.id,
                subscriptionType: subscriptionForm.subscriptionType,
                monthlyFee: pricing.price,
                startDate: subscriptionForm.startDate,
                endDate: subscriptionForm.endDate
            });
            alert('Đăng ký gói cước thành công!');
            setSubscriptionModal(null);
            fetchVehicles();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleCancelSubscription = async () => {
        if (!subscriptionModal?.subscription) return;
        try {
            await cancelSubscription(subscriptionModal.subscription.id);
            alert('Đã hủy gói cước!');
            setSubscriptionModal(null);
            fetchVehicles();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const getVehicleTypeIcon = (type: VehicleType) => {
        switch (type) {
            case VehicleType.CAR:
                return <Car className="w-5 h-5" />;
            case VehicleType.MOTORBIKE:
                return <Bike className="w-5 h-5" />;
            case VehicleType.BICYCLE:
                return <Bike className="w-5 h-5" />;
            case VehicleType.ELECTRIC_BIKE:
                return <Zap className="w-5 h-5" />;
            default:
                return <Car className="w-5 h-5" />;
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

    const getSubscriptionTypeText = (type: SubscriptionType) => {
        switch (type) {
            case SubscriptionType.MONTHLY:
                return 'Tháng';
            case SubscriptionType.QUARTERLY:
                return 'Quý';
            case SubscriptionType.YEARLY:
                return 'Năm';
            case SubscriptionType.VISITOR:
                return 'Khách';
            default:
                return type;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Xe</h1>
                    <p className="text-sm text-gray-500 font-medium">
                        Danh sách phương tiện đã đăng ký trong hệ thống
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm xe mới
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm theo biển số..."
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

                {(typeFilter || searchTerm) && (
                    <button
                        onClick={handleClearFilters}
                        className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                    >
                        <FilterX className="w-4 h-4" /> Xóa lọc
                    </button>
                )}

                <button
                    onClick={() => fetchVehicles()}
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
                                        <th className="px-6 py-4">Thông tin xe</th>
                                        <th className="px-6 py-4">Chủ xe</th>
                                        <th className="px-6 py-4">Căn hộ</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {vehicles.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                Không có xe nào
                                            </td>
                                        </tr>
                                    ) : (
                                        vehicles.map(vehicle => (
                                            <tr key={vehicle.id} className="hover:bg-gray-50 group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-blue-600 font-mono text-lg">
                                                        {vehicle.licensePlate}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono italic">
                                                        ID: #{vehicle.id}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`p-2 rounded-lg ${vehicle.vehicleType === VehicleType.CAR
                                                                    ? 'bg-purple-100 text-purple-600'
                                                                    : vehicle.vehicleType === VehicleType.MOTORBIKE
                                                                        ? 'bg-blue-100 text-blue-600'
                                                                        : 'bg-green-100 text-green-600'
                                                                }`}
                                                        >
                                                            {getVehicleTypeIcon(vehicle.vehicleType)}
                                                        </div>
                                                        <span className="font-medium">
                                                            {getVehicleTypeText(vehicle.vehicleType)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {vehicle.brand || vehicle.model ? (
                                                        <div>
                                                            <div className="font-medium">
                                                                {vehicle.brand} {vehicle.model}
                                                            </div>
                                                            {vehicle.color && (
                                                                <div className="text-xs text-gray-400">Màu: {vehicle.color}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {vehicle.ownerName ? (
                                                        <div>
                                                            <div className="font-medium">{vehicle.ownerName}</div>
                                                            {vehicle.ownerPhone && (
                                                                <div className="text-xs text-gray-400">{vehicle.ownerPhone}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-blue-600">
                                                    {vehicle.roomNumber || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleOpenSubscription(vehicle)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                            title="Quản lý gói cước"
                                                        >
                                                            <CreditCard className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEdit(vehicle)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmId(vehicle.id)}
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingVehicle ? 'Chỉnh sửa Xe' : 'Thêm Xe Mới'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                        disabled={!!editingVehicle}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-gray-100"
                                    />
                                </div>
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
                                        Tên chủ xe
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Họ và tên"
                                        value={formData.ownerName}
                                        onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="0912345678"
                                        value={formData.ownerPhone}
                                        onChange={e => setFormData({ ...formData, ownerPhone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
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

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
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
                                    {editingVehicle ? 'Cập nhật' : 'Thêm xe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subscription Modal */}
            {subscriptionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Quản lý Gói cước</h2>
                            <button
                                onClick={() => setSubscriptionModal(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-center mb-4">
                                <div className="text-lg font-bold font-mono text-blue-600">
                                    {subscriptionModal.vehicle.licensePlate}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {getVehicleTypeText(subscriptionModal.vehicle.vehicleType)}
                                </div>
                            </div>

                            {subscriptionModal.subscription ? (
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 text-green-600 font-bold mb-2">
                                        <CreditCard className="w-5 h-5" />
                                        Đang có gói cước
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Loại gói:</span>
                                            <span className="font-medium">
                                                {getSubscriptionTypeText(subscriptionModal.subscription.subscriptionType)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Phí:</span>
                                            <span className="font-medium">
                                                {formatCurrency(subscriptionModal.subscription.monthlyFee)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Từ ngày:</span>
                                            <span className="font-medium">
                                                {formatDate(subscriptionModal.subscription.startDate)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Đến ngày:</span>
                                            <span className="font-medium">
                                                {formatDate(subscriptionModal.subscription.endDate)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCancelSubscription}
                                        className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Hủy gói cước
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-gray-500 text-sm mb-2">Chưa có gói cước</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loại gói cước
                                        </label>
                                        <select
                                            value={subscriptionForm.subscriptionType}
                                            onChange={e =>
                                                handleSubscriptionTypeChange(e.target.value as SubscriptionType)
                                            }
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="MONTHLY">Tháng</option>
                                            <option value="QUARTERLY">Quý (3 tháng)</option>
                                            <option value="YEARLY">Năm</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Từ ngày
                                            </label>
                                            <input
                                                type="date"
                                                value={subscriptionForm.startDate}
                                                onChange={e => {
                                                    setSubscriptionForm({
                                                        ...subscriptionForm,
                                                        startDate: e.target.value
                                                    });
                                                    handleSubscriptionTypeChange(subscriptionForm.subscriptionType);
                                                }}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Đến ngày
                                            </label>
                                            <input
                                                type="date"
                                                value={subscriptionForm.endDate}
                                                onChange={e =>
                                                    setSubscriptionForm({ ...subscriptionForm, endDate: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {pricings.length > 0 && (
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="text-sm text-blue-600">
                                                <DollarSign className="w-4 h-4 inline mr-1" />
                                                Giá:{' '}
                                                <span className="font-bold">
                                                    {formatCurrency(
                                                        pricings.find(
                                                            p => p.subscriptionType === subscriptionForm.subscriptionType
                                                        )?.price || 0
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCreateSubscription}
                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Đăng ký gói cước
                                    </button>
                                </div>
                            )}
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
                            Bạn có chắc muốn xóa xe này? Tất cả dữ liệu liên quan sẽ bị xóa.
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

export default VehicleManager;
