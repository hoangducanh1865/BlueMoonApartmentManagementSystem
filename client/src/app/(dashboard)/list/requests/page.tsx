import React, { useState } from 'react';
import { MOCK_REQUESTS, MOCK_HOUSEHOLDS } from '../../../../lib/mockData';
import { RequestTicket } from '@/src/lib/types';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

const RequestManager: React.FC = () => {
  const [requests, setRequests] = useState<RequestTicket[]>(MOCK_REQUESTS);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<RequestTicket | null>(null);

  const filteredRequests = requests.filter(r =>
    filterStatus === 'ALL' ? true : r.status === filterStatus
  );

  const getHouseholdInfo = (id: string) => {
    const h = MOCK_HOUSEHOLDS.find(house => house.id === id);
    return h ? `Phòng ${h.roomNumber} - ${h.ownerName}` : 'Không xác định';
  };

  const handleApprove = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn duyệt yêu cầu này? Dữ liệu hộ khẩu sẽ được cập nhật.')) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
      setSelectedRequest(null);
      alert('Đã duyệt yêu cầu và cập nhật dữ liệu thành công!');
    }
  };

  const handleReject = (id: string) => {
    const reason = window.prompt('Nhập lý do từ chối:');
    if (reason !== null) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: 'REJECTED', rejectReason: reason } : r));
      setSelectedRequest(null);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Đã duyệt</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Từ chối</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Xử lý yêu cầu cư dân</h1>

        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filterStatus === status
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              {status === 'ALL' ? 'Tất cả' : status === 'PENDING' ? 'Chờ duyệt' : status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Mã YC</th>
                <th className="px-6 py-4">Căn hộ</th>
                <th className="px-6 py-4">Tiêu đề</th>
                <th className="px-6 py-4">Ngày gửi</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-gray-500">#{req.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{getHouseholdInfo(req.householdId)}</td>
                  <td className="px-6 py-4">{req.title}</td>
                  <td className="px-6 py-4">{req.createdAt}</td>
                  <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="text-blue-600 hover:text-blue-800 flex items-center justify-end w-full"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    Không có yêu cầu nào trong danh sách
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Chi tiết yêu cầu #{selectedRequest.id}</h2>
                <p className="text-sm text-gray-500 mt-1">Gửi bởi: {getHouseholdInfo(selectedRequest.householdId)}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Nội dung yêu cầu</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-900 mb-1">{selectedRequest.title}</p>
                  <p className="text-gray-600">{selectedRequest.description}</p>
                </div>
              </div>

              {selectedRequest.changes && selectedRequest.changes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Thông tin thay đổi</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left">Trường thông tin</th>
                          <th className="px-4 py-2 text-left text-red-600">Dữ liệu cũ</th>
                          <th className="px-4 py-2 text-left"></th>
                          <th className="px-4 py-2 text-left text-green-600">Dữ liệu mới</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRequest.changes.map((change, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 font-medium text-gray-900">{change.label}</td>
                            <td className="px-4 py-3 text-red-600 bg-red-50">{change.oldValue}</td>
                            <td className="px-4 py-3 text-center text-gray-400"><ArrowRight className="w-4 h-4 mx-auto" /></td>
                            <td className="px-4 py-3 text-green-600 bg-green-50 font-bold">{change.newValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'REJECTED' && selectedRequest.rejectReason && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-red-800">Lý do từ chối:</p>
                  <p className="text-red-700">{selectedRequest.rejectReason}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
              >
                Đóng
              </button>

              {selectedRequest.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-medium shadow-sm"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-sm"
                  >
                    Duyệt yêu cầu
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManager;
