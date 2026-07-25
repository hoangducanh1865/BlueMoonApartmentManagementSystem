import React, { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, KeyRound, RefreshCw } from "lucide-react";
import {
  createResidentRegistrationCode,
  getResidentRegistrationCodes,
  ResidentRegistrationCode,
} from "../../../../lib/residentRegistrationCodeService";

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const statusLabel = (code: ResidentRegistrationCode) => {
  if (code.usedAt) return { text: "Đã dùng", className: "bg-gray-100 text-gray-700" };
  if (code.expired) return { text: "Hết hạn", className: "bg-red-100 text-red-700" };
  return { text: "Còn sống", className: "bg-green-100 text-green-700" };
};

const RegistrationCodesPage: React.FC = () => {
  const [residentId, setResidentId] = useState("");
  const [ttlHours, setTtlHours] = useState(4);
  const [codes, setCodes] = useState<ResidentRegistrationCode[]>([]);
  const [createdCode, setCreatedCode] = useState<ResidentRegistrationCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => codes.filter((code) => code.active).length,
    [codes]
  );

  const loadCodes = async () => {
    setLoading(true);
    setError("");
    try {
      setCodes(await getResidentRegistrationCodes());
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách mã đăng ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setCopied(false);

    const parsedResidentId = Number(residentId);
    if (!Number.isInteger(parsedResidentId) || parsedResidentId <= 0) {
      setError("ID hồ sơ cư dân phải là một số hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      const newCode = await createResidentRegistrationCode(parsedResidentId, ttlHours);
      setCreatedCode(newCode);
      setResidentId("");
      await loadCodes();
    } catch (err: any) {
      setError(err.message || "Không thể tạo mã đăng ký");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mã đăng ký cư dân</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo mã dùng một lần để cư dân xác thực khi đăng ký tài khoản.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCodes}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Tạo mã mới</h2>
              <p className="text-xs text-slate-500">{activeCount} mã đang còn sống</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ID hồ sơ cư dân
              </label>
              <input
                type="number"
                min="1"
                required
                value={residentId}
                onChange={(event) => setResidentId(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="VD: 102"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Thời gian sống
              </label>
              <select
                value={ttlHours}
                onChange={(event) => setTtlHours(Number(event.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value={1}>1 giờ</option>
                <option value={2}>2 giờ</option>
                <option value={4}>4 giờ</option>
                <option value={8}>8 giờ</option>
                <option value={12}>12 giờ</option>
                <option value={24}>24 giờ</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Đang tạo..." : "Tạo mã đăng ký"}
            </button>
          </form>

          {createdCode && (
            <div className="mt-5 rounded-md border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800 mb-2">Mã vừa tạo</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded bg-white px-3 py-2 text-sm text-slate-900">
                  {createdCode.code}
                </code>
                <button
                  type="button"
                  onClick={() => copyCode(createdCode.code)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-green-300 bg-white text-green-700 hover:bg-green-100"
                  title="Sao chép mã"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-green-700">
                Hết hạn: {formatDateTime(createdCode.expiresAt)}
              </p>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Mã gần đây</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Mã</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Cư dân</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Hết hạn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {codes.map((code) => {
                  const status = statusLabel(code);
                  return (
                    <tr key={code.id}>
                      <td className="max-w-[260px] px-4 py-3">
                        <code className="block truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-800">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium text-slate-900">
                          {code.residentName || `ID ${code.residentId}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          Hồ sơ #{code.residentId}
                          {code.residentCode ? ` · Mã cư dân ${code.residentCode}` : ""}
                          {` · ${code.residentPhone}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateTime(code.expiresAt)}
                      </td>
                    </tr>
                  );
                })}

                {!loading && codes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Chưa có mã đăng ký nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegistrationCodesPage;
