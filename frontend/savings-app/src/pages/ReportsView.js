import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar


} from 'recharts';


const COLORS = [
    '#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0',
    '#00bcd4', '#8bc34a', '#ff5722', '#3f51b5', '#e91e63'
];


function ReportsView() {
    const [data, setData] = useState([]);
    const [byCategory, setByCategory] = useState([]);
    const [monthlyAverages, setMonthlyAverages] = useState([]);


    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:8000/reports/expenses-by-category', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setByCategory)
            .catch(console.error);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');

        fetch('http://localhost:8000/reports/balance-over-time', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, []);


    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:8000/reports/monthly-averages', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then((data) => {
                const converted = Object.entries(data).map(([period, values]) => ({
                    period,
                    income: values.income || 0,
                    expense: values.expense || 0,
                }));
                setMonthlyAverages(converted);
            })
            .catch(console.error);
    }, []);


    return (
  <div className="flex justify-center">
    <div className="w-full max-w-xl space-y-10">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">
          📈 Bilans w czasie
        </h3>
        {data.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Brak danych do wyświetlenia.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#4caf50" name="Przychody" />
              <Line type="monotone" dataKey="expense" stroke="#f44336" name="Wydatki" />
              <Line type="monotone" dataKey="balance" stroke="#2196f3" name="Saldo" />
              <Line type="monotone" dataKey="cumulative_balance" stroke="#9c27b0" name="Saldo skumulowane" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">
          🧾 Wydatki według kategorii
        </h3>
        {byCategory.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Brak danych.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {byCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">
          📊 Średnie miesięczne
        </h3>
        {monthlyAverages.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Brak danych.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#4caf50" name="Przychody" />
              <Bar dataKey="expense" fill="#f44336" name="Wydatki" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  </div>
);

}

export default ReportsView;
