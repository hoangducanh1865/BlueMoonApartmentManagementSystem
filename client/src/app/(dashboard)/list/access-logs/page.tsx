import React, { useState, useEffect, useRef } from 'react';
import {
    getAccessLogs,
    getCurrentlyParkedVehicles,
    recordEntry,
    recordExit,
    markPaid
} from '../../../../lib/parkingService';
import {
    Search, Loader2, RefreshCcw, ChevronLeft, ChevronRight,
    LogIn, LogOut, FilterX, Car, Clock, DollarSign,
    CheckCircle, XCircle, Calendar, Activity, Pause, Play,
    ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import { ParkingAccessLog } from '@/src/lib/types';

const AccessLogsManager: React.FC = () => {
    const [logs, setLogs] = useState<ParkingAccessLog[]>([]);
    const [currentlyParked, setCurrentlyParked] = useState<ParkingAccessLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });
    const [viewMode, setViewMode] = useState<'all' | 'parked'>('all');

    // Auto refresh
    const [autoRefresh, setAutoRefresh] = useState(true);
    const refreshInterval = useRef<NodeJS.Timeout | null>(null);

    // Manual entry/exit modal
    const [manualModal, setManualModal] = useState<'entry' | 'exit' | null>(null);
    const [manualLicensePlate, setManualLicensePlate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchLogs = async () => {
        try {
            if (viewMode === 'all') {
                const data = await getAccessLogs(
                    page,
                    size,
                    searchTerm || undefined,
                    dateFilter.startDate || undefined,
                    dateFilter.endDate || undefined
                );
                setLogs(data.content);
                setTotalPages(data.totalPages);
            } else {
                const data = await getCurrentlyParkedVehicles(page, size);
                setCurrentlyParked(data.content);
                setTotalPages(data.totalPages);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, size, viewMode]);

    // Auto refresh every 10 seconds
    useEffect(() => {
        if (autoRefresh) {
            refreshInterval.current = setInterval(() => {
                fetchLogs();
            }, 10000);
        }

        return () => {
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
            }
        };
    }, [autoRefresh, page, size, viewMode, searchTerm, dateFilter]);

    const handleSearch = () => {
        setPage(0);
        fetchLogs();
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setDateFilter({ startDate: '', endDate: '' });
        setPage(0);
    };

    const handleManualEntry = async () => {
        if (!manualLicensePlate) return;
        setIsSubmitting(true);
        try {
            await recordEntry({ licensePlate: manualLicensePlate.toUpperCase() });
            alert(`Đã ghi nhận xe ${manualLicensePlate.toUpperCase()} vào bãi!`);
            setManualModal(null);
            setManualLicensePlate('');
            fetchLogs();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManualExit = async () => {
        if (!manualLicensePlate) return;
        setIsSubmitting(true);
        try {
            const result = await recordExit({ licensePlate: manualLicensePlate.toUpperCase() });
            alert(
                `Đã ghi nhận xe ${manualLicensePlate.toUpperCase()} ra khỏi bãi!\n` +
                (result.parkingFee ? `Phí: ${formatCurrency(result.parkingFee)}` : '')
            );
            setManualModal(null);
            setManualLicensePlate('');
            fetchLogs();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkPaid = async (logId: number) => {
        try {
            await markPaid(logId);
            alert('Đã đánh dấu thanh toán!');
            fetchLogs();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDuration = (entryTime: string, exitTime?: string | null) => {
        const start = new Date(entryTime);
        const end = exitTime ? new Date(exitTime) : new Date();
        const diff = Math.floor((end.getTime() - start.getTime()) / 1000);

        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const displayLogs = viewMode === 'all' ? logs : currentlyParked;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Log Ra/Vào Bãi Xe</h1>
                    <p className="text-sm text-gray-500 font-medium">
                        Theo dõi lịch sử ra vào của phương tiện
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${autoRefresh
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {autoRefresh ? (
                            <>
                                <Activity className="w-4 h-4 animate-pulse" />
                                Đang tự động cập nhật
                            </>
                        ) : (
                            <>
                                <Pause className="w-4 h-4" />
                                Tạm dừng
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setManualModal('entry')}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold shadow-md"
                    >
                        <ArrowDownCircle className="w-5 h-5 mr-2" />
                        Xe Vào
                    </button>
                    <button
                        onClick={() => setManualModal('exit')}
                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold shadow-md"
                    >
                        <ArrowUpCircle className="w-5 h-5 mr-2" />
                        Xe Ra
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Car className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Xe đang trong bãi</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {currentlyParked.length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <LogIn className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Lượt vào hôm nay</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {logs.filter(l => {
                                    const today = new Date().toDateString();
                                    return new Date(l.entryTime).toDateString() === today;
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <LogOut className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Lượt ra hôm nay</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {logs.filter(l => {
                                    if (!l.exitTime) return false;
                                    const today = new Date().toDateString();
                                    return new Date(l.exitTime).toDateString() === today;
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 inline-flex">
                <button
                    onClick={() => {
                        setViewMode('all');
                        setPage(0);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Tất cả Log
                </button>
                <button
                    onClick={() => {
                        setViewMode('parked');
                        setPage(0);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'parked'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Đang trong bãi
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

                {viewMode === 'all' && (
                    <>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateFilter.startDate}
                                onChange={e =>
                                    setDateFilter({ ...dateFilter, startDate: e.target.value })
                                }
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateFilter.endDate}
                                onChange={e =>
                                    setDateFilter({ ...dateFilter, endDate: e.target.value })
                                }
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                            />
                        </div>
                    </>
                )}

                {(searchTerm || dateFilter.startDate || dateFilter.endDate) && (
                    <button
                        onClick={handleClearFilters}
                        className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                    >
                        <FilterX className="w-4 h-4" /> Xóa lọc
                    </button>
                )}

                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    Tìm kiếm
                </button>

                <button
                    onClick={() => fetchLogs()}
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
                                        <th className="px-6 py-4">Thời gian vào</th>
                                        <th className="px-6 py-4">Thời gian ra</th>
                                        <th className="px-6 py-4">Thời lượng</th>
                                        <th className="px-6 py-4">Phí</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {displayLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                Không có dữ liệu
                                            </td>
                                        </tr>
                                    ) : (
                                        displayLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50 group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <Car className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-blue-600 font-mono">
                                                                {log.licensePlate}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400">
                                                                ID: #{log.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <LogIn className="w-4 h-4" />
                                                        <span>{formatDateTime(log.entryTime)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.exitTime ? (
                                                        <div className="flex items-center gap-1 text-orange-600">
                                                            <LogOut className="w-4 h-4" />
                                                            <span>{formatDateTime(log.exitTime)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                            Đang trong bãi
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatDuration(log.entryTime, log.exitTime)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.parkingFee !== null && log.parkingFee !== undefined ? (
                                                        <div className="flex items-center gap-1 text-gray-900 font-medium">
                                                            <DollarSign className="w-4 h-4" />
                                                            <span>{formatCurrency(log.parkingFee)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.exitTime ? (
                                                        log.isPaid ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Đã thanh toán
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                                <XCircle className="w-3 h-3" />
                                                                Chưa thanh toán
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                                            <Activity className="w-3 h-3" />
                                                            Đang đỗ
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {log.exitTime && !log.isPaid && (
                                                            <button
                                                                onClick={() => handleMarkPaid(log.id)}
                                                                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                            >
                                                                Đánh dấu đã thanh toán
                                                            </button>
                                                        )}
                                                        {!log.exitTime && (
                                                            <button
                                                                onClick={() => {
                                                                    setManualLicensePlate(log.licensePlate);
                                                                    setManualModal('exit');
                                                                }}
                                                                className="px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                                            >
                                                                Ghi nhận ra
                                                            </button>
                                                        )}
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

            {/* Manual Entry/Exit Modal */}
            {manualModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div
                            className={`p-6 rounded-t-2xl ${manualModal === 'entry' ? 'bg-green-600' : 'bg-orange-600'
                                }`}
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {manualModal === 'entry' ? (
                                    <>
                                        <ArrowDownCircle className="w-6 h-6" />
                                        Ghi nhận Xe Vào
                                    </>
                                ) : (
                                    <>
                                        <ArrowUpCircle className="w-6 h-6" />
                                        Ghi nhận Xe Ra
                                    </>
                                )}
                            </h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Biển số xe *
                                </label>
                                <input
                                    type="text"
                                    placeholder="VD: 29A-12345"
                                    value={manualLicensePlate}
                                    onChange={e => setManualLicensePlate(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xl text-center uppercase"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setManualModal(null);
                                        setManualLicensePlate('');
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={manualModal === 'entry' ? handleManualEntry : handleManualExit}
                                    disabled={!manualLicensePlate || isSubmitting}
                                    className={`flex-1 px-4 py-3 rounded-lg text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${manualModal === 'entry'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-orange-600 hover:bg-orange-700'
                                        }`}
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {manualModal === 'entry' ? 'Ghi nhận Vào' : 'Ghi nhận Ra'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessLogsManager;
