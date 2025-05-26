import React, { useEffect, useState } from 'react';

function SavingsList() {
    const [goals, setGoals] = useState([]);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [depositGoal, setDepositGoal] = useState(null); // cel, do którego wpłacasz
    const [depositAmount, setDepositAmount] = useState('');
    const [depositDate, setDepositDate] = useState('');
    const [depositDesc, setDepositDesc] = useState('');




    useEffect(() => {
        const token = localStorage.getItem('token');

        fetch('http://localhost:8000/savings', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(res => res.json())
            .then(data => setGoals(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>

            <div className="flex justify-center mb-4">
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    ➕ Dodaj cel
                </button>
            </div>



            {goals.length === 0 && <p>Brak celów.</p>}
            <div className="flex justify-center">
                <div className="w-full max-w-xl">
                    <ul className="space-y-4">
                        {goals.map((goal) => {
                            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100).toFixed(0);

                            return (
                                <li
                                    key={goal.id}
                                    className="bg-white p-4 rounded shadow border border-gray-200"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-lg font-semibold text-gray-800">{goal.name}</div>
                                        <button
                                            onClick={() => {
                                                setDepositGoal(goal);
                                                setDepositAmount('');
                                                setDepositDate(new Date().toISOString().split('T')[0]);
                                                setDepositDesc('');
                                            }}
                                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                        >
                                            💰 Wpłać
                                        </button>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-1">
                                        Cel: {goal.target_amount.toFixed(2)} zł | Zebrano: {goal.current_amount.toFixed(2)} zł
                                    </div>

                                    <div className="w-full bg-gray-200 h-2 rounded overflow-hidden mb-1">
                                        <div
                                            className="h-full bg-green-500"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>

                                    <div className="text-xs text-gray-500 flex justify-between">
                                        <span>Postęp: {progress}%</span>
                                        {goal.target_date && (
                                            <span>Termin: {new Date(goal.target_date).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>




            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h4 className="text-lg font-semibold mb-4 text-center">
                            Nowy cel oszczędnościowy
                        </h4>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const token = localStorage.getItem('token');

                                try {
                                    const res = await fetch('http://localhost:8000/savings', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            name,
                                            target_amount: parseFloat(targetAmount),
                                            current_amount: 0,
                                            target_date: targetDate || null
                                        })
                                    });

                                    if (!res.ok) throw new Error('Błąd podczas dodawania celu');

                                    setName('');
                                    setTargetAmount('');
                                    setTargetDate('');
                                    setShowForm(false);

                                    const updated = await fetch('http://localhost:8000/savings', {
                                        headers: { Authorization: `Bearer ${token}` }
                                    }).then(res => res.json());
                                    setGoals(updated);
                                } catch (err) {
                                    alert(err.message);
                                }
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium mb-1">Nazwa celu</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Kwota docelowa (zł)</label>
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Termin (opcjonalnie)</label>
                                <input
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Dodaj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}




            {depositGoal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h4 className="text-lg font-semibold mb-4 text-center">
                            Wpłata na: {depositGoal.name}
                        </h4>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const token = localStorage.getItem('token');

                                try {
                                    const res = await fetch('http://localhost:8000/savings/deposits/', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            amount: parseFloat(depositAmount),
                                            saving_goal_id: depositGoal.id,
                                            date: depositDate,
                                            description: depositDesc
                                        })
                                    });

                                    if (!res.ok) throw new Error('Błąd przy wpłacie');

                                    setDepositGoal(null);
                                    const updated = await fetch('http://localhost:8000/savings', {
                                        headers: { Authorization: `Bearer ${token}` }
                                    }).then(res => res.json());
                                    setGoals(updated);
                                } catch (err) {
                                    alert(err.message);
                                }
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium mb-1">Kwota</label>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Data</label>
                                <input
                                    type="date"
                                    value={depositDate}
                                    onChange={(e) => setDepositDate(e.target.value)}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Opis (opcjonalnie)</label>
                                <input
                                    value={depositDesc}
                                    onChange={(e) => setDepositDesc(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDepositGoal(null)}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Dodaj wpłatę
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}



        </div>
    );
}

export default SavingsList;
