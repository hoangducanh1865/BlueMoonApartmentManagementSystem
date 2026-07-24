import React, { useState, useEffect, useRef } from 'react';
import {
    getRegisteredFaces,
    getBuildingAccessLogs,
    registerFace
} from '../../../../lib/faceAccessService';
import { FaceRegistration, BuildingAccessLog } from '../../../../lib/types';
import {
    User, Activity, Plus, Upload, Loader2, CheckCircle, XCircle,
    Search, RefreshCcw, ChevronLeft, ChevronRight, Calendar, FilterX
} from 'lucide-react';

const FaceAccessPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'logs' | 'users'>('logs');
    
    // Logs state
    const [logs, setLogs] = useState<BuildingAccessLog[]>([]);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });
    
    // Users state
    const [users, setUsers] = useState<FaceRegistration[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Registration form
    const [showModal, setShowModal] = useState(false);
    const [newUserId, setNewUserId] = useState('');
    const [newName, setNewName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Auto refresh
    const [autoRefresh, setAutoRefresh] = useState(true);
    const refreshInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getBuildingAccessLogs(
                page, 
                size, 
                searchTerm || undefined, 
                dateFilter.startDate || undefined, 
                dateFilter.endDate || undefined
            );
            setLogs(data.content);
            setTotalPages(data.totalPages);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await getRegisteredFaces();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        } else {
            fetchUsers();
        }
    }, [activeTab, page, size]);

    // Auto refresh logic
    useEffect(() => {
        if (autoRefresh && activeTab === 'logs') {
            refreshInterval.current = setInterval(() => {
                fetchLogs();
            }, 10000);
        }
        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current);
        };
    }, [autoRefresh, activeTab, page, size, searchTerm, dateFilter]);

    const handleSearch = () => {
        setPage(0);
        fetchLogs();
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setDateFilter({ startDate: '', endDate: '' });
        setPage(0);
        setTimeout(fetchLogs, 0); 
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !newUserId || !newName) return;

        setSubmitting(true);
        try {
            await registerFace(newUserId, newName, selectedFile);
            setShowModal(false);
            setNewUserId('');
            setNewName('');
            setSelectedFile(null);
            if (activeTab === 'users') fetchUsers();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Face Access Control</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Register Face
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    className={`pb-2 px-4 ${activeTab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('logs')}
                >
                    Access Logs
                </button>
                <button
                    className={`pb-2 px-4 ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('users')}
                >
                    Registered Users
                </button>
            </div>

            {activeTab === 'logs' && (
                <div className="mb-6 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search user, ID, or access point..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="datetime-local"
                                    className="pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={dateFilter.startDate}
                                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                                />
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="datetime-local"
                                    className="pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={dateFilter.endDate}
                                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Search
                        </button>
                        
                        {(searchTerm || dateFilter.startDate || dateFilter.endDate) && (
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                            >
                                <FilterX size={18} /> Clear
                            </button>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                Auto-refresh
                            </label>
                            <button
                                onClick={() => fetchLogs()}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                title="Refresh"
                            >
                                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Logs Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Time</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">User</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Access Point</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Type</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Snapshot</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-medium">{log.userName || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{log.userId}</div>
                                        </td>
                                        <td className="py-3 px-4">{log.accessPointName}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                log.accessType === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {log.accessType}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {log.success ? (
                                                <CheckCircle size={18} className="text-green-500" />
                                            ) : (
                                                <XCircle size={18} className="text-red-500" />
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {log.snapshotUrl && (
                                                <img 
                                                    src={`http://localhost:8080${log.snapshotUrl}`} 
                                                    alt="Snapshot" 
                                                    className="h-10 w-10 rounded object-cover border cursor-pointer hover:scale-150 transition-transform origin-left"
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">
                                            No access logs found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <div className="text-sm text-gray-500">
                                Page {page + 1} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {users.map((user) => (
                            <div key={user.id} className="border rounded-lg p-4 flex items-center gap-4">
                                <img 
                                    src={`http://localhost:8080${user.imageUrl}`} 
                                    alt={user.name} 
                                    className="w-16 h-16 rounded-full object-cover border"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-800">{user.name}</h3>
                                    <p className="text-sm text-gray-500">ID: {user.userId}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Registered: {new Date(user.registeredAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && !loading && (
                            <div className="col-span-3 text-center py-8 text-gray-500">
                                No registered users
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Register New Face</h2>
                        <form onSubmit={handleRegister}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={newUserId}
                                    onChange={(e) => setNewUserId(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Face Image</label>
                                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        required
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="face-upload"
                                    />
                                    <label htmlFor="face-upload" className="cursor-pointer flex flex-col items-center">
                                        <Upload className="text-gray-400 mb-2" />
                                        <span className="text-sm text-blue-600">Click to upload image</span>
                                        {selectedFile && (
                                            <span className="text-xs text-gray-500 mt-2">{selectedFile.name}</span>
                                        )}
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Registering...' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaceAccessPage;
