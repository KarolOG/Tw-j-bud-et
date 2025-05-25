import React, { useEffect, useState } from 'react';
import TransactionsList from './TransactionsList';
import SavingsList from './SavingsList';
import ReportsView from './ReportsView';




function Dashboard() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(null);
    const [activeTab, setActiveTab] = useState('transactions');





    useEffect(() => {
        const token = localStorage.getItem('token');

        fetch('http://localhost:8000/user/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Nie można pobrać danych użytkownika');
                return res.json();
            })
            .then((data) => {
                setUser(data);
            })
            .catch((err) => {
                console.error(err);
                setUser(null);
            });
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            {user ? (
                <div className="flex items-center justify-between bg-white shadow px-6 py-4 rounded mb-6">
                    <div className="text-xl font-semibold text-blue-600 tracking-wide">
                        💼 Twój Budżet
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-700 font-medium">{user.full_name}</span>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                window.location.href = '/login';
                            }}
                            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                            Wyloguj
                        </button>
                    </div>
                </div>
            ) : (
                <p>Ładowanie danych...</p>
            )}
            <div className="flex justify-center gap-4 my-6">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-4 py-2 rounded ${activeTab === 'transactions'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                        }`}
                >
                    💸 Transakcje
                </button>
                <button
                    onClick={() => setActiveTab('savings')}
                    className={`px-4 py-2 rounded ${activeTab === 'savings'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                        }`}
                >
                    🎯 Oszczędności
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 rounded ${activeTab === 'reports'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                        }`}
                >
                    📊 Raporty
                </button>
            </div>


            {activeTab === 'transactions' && <TransactionsList />}
            {activeTab === 'savings' && <SavingsList />}
            {activeTab === 'reports' && <ReportsView />}


        </div>
    );
}

export default Dashboard;
