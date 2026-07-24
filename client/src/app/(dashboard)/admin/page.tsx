import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MOCK_STATS } from '../../../lib/mockData';
import { getHouseholds } from '../../../lib/householdService';
import { getInvoices } from '../../../lib/invoiceService';
import { Users, CreditCard, Home, TrendingUp, Loader2 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [householdsData, invoicesData] = await Promise.all([
          getHouseholds(),
          getInvoices(0, 1000)
        ]);

        setTotalHouseholds(householdsData.length);

        const paidInvoices = invoicesData.content.filter(inv => inv.status === 'paid');
        const unpaidInvoices = invoicesData.content.filter(inv => inv.status === 'unpaid');

        const revenue = paidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
        const debt = unpaidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

        setTotalRevenue(revenue);
        setTotalDebt(debt);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-sm font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">+2.5%</span>
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Quản Trị</h1>
        <p className="text-gray-500">Tổng quan tình hình chung cư Bluemoon</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng số hộ dân"
          value={totalHouseholds}
          icon={Home}
          color="bg-blue-500"
        />
        <StatCard
          title="Tổng doanh thu (Năm nay)"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Tổng nợ xấu"
          value={formatCurrency(totalDebt)}
          icon={CreditCard}
          color="bg-red-500"
        />
        <StatCard
          title="Yêu cầu cần xử lý"
          value="1"
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Biểu đồ doanh thu & Công nợ</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={MOCK_STATS}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" name="Doanh thu" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="debt" name="Công nợ" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Hoạt động gần đây</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-3 text-sm border-b border-gray-50 pb-3 last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-gray-800">Căn hộ <span className="font-medium">1204</span> đã thanh toán tiền điện T10.</p>
                  <p className="text-xs text-gray-400 mt-0.5">2 giờ trước</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
