import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, User, ChevronDown, Calendar, CheckCircle, Save, Loader2 } from 'lucide-react';
import { ResidentInfo, RegistrationType } from '@/src/lib/types';

interface RegistrationFormProps {
  residents: ResidentInfo[];
  selectedResident: ResidentInfo | null;
  onSelectResident: (resident: ResidentInfo) => void;
  formType: RegistrationType;
  formStartDate: string;
  formEndDate: string;
  formReason: string;
  onTypeChange: (type: RegistrationType) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReasonChange: (reason: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
  isLoadingData?: boolean;
  title?: string;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  residents,
  selectedResident,
  onSelectResident,
  formType,
  formStartDate,
  formEndDate,
  formReason,
  onTypeChange,
  onStartDateChange,
  onEndDateChange,
  onReasonChange,
  onSubmit,
  onCancel,
  isEditing = false,
  isSubmitting = false,
  isLoadingData = false,
  title
}) => {
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [isResidentDropdownOpen, setIsResidentDropdownOpen] = useState(false);
  const residentDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (residentDropdownRef.current && !residentDropdownRef.current.contains(event.target as Node)) {
        setIsResidentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredResidents = residents.filter(r => {
    const query = residentSearchQuery.toLowerCase();
    return r.name.toLowerCase().includes(query) || r.roomNumber.toLowerCase().includes(query);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            {title || (isEditing ? 'Cập nhật đăng ký' : 'Đăng ký hộ cư dân')}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Cư dân đăng ký
              </label>
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
                            onSelectResident(r);
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Loại hình
                </label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-bold"
                  value={formType}
                  onChange={(e) => onTypeChange(e.target.value as RegistrationType)}
                >
                  <option value="TAM_TRU">Tạm trú</option>
                  <option value="TAM_VANG">Tạm vắng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Trạng thái
                </label>
                <div className="px-3 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" /> {isEditing ? 'Đang chỉnh sửa' : 'Hệ thống tự duyệt'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Ngày bắt đầu
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white font-bold"
                    value={formStartDate}
                    onChange={e => onStartDateChange(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Ngày kết thúc
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white font-bold"
                    value={formEndDate}
                    onChange={e => onEndDateChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Lý do đăng ký
              </label>
              <textarea
                required
                placeholder="Nhập lý do vắng mặt hoặc lưu trú..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400 font-medium"
                rows={3}
                value={formReason}
                onChange={e => onReasonChange(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedResident}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isEditing ? 'Cập nhật đăng ký' : 'Hoàn tất tạo đăng ký'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
