import React, { useEffect, useState } from 'react';

function TransactionsList() {
    const [transactions, setTransactions] = useState([]);
    const [selectedTx, setSelectedTx] = useState(null);
    const [monthOffset, setMonthOffset] = useState(0);
    const [balance, setBalance] = useState(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [date, setDate] = useState('');
    const [newCatName, setNewCatName] = useState('');
    const [transactionType, setTransactionType] = useState('expense');
    const [editingTx, setEditingTx] = useState(null);


    useEffect(() => {
        setCategoryId('');
    }, [transactionType]);




    const today = new Date();
    const viewedDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = viewedDate.getFullYear();
    const month = viewedDate.getMonth() + 1;


    const fetchBalance = () => {
        const token = localStorage.getItem('token');
        fetch(`http://localhost:8000/reports/balance?year=${year}&month=${month}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Nie można pobrać bilansu');
                return res.json();
            })
            .then(data => setBalance(data))
            .catch(err => console.error(err));
    };




    useEffect(() => {
        const token = localStorage.getItem('token');


        fetch('http://localhost:8000/category', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error(err));


        const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
        const dateTo = new Date(year, month, 0).toISOString().split('T')[0];

        fetch(`http://localhost:8000/transaction?date_from=${dateFrom}&date_to=${dateTo}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Nie można pobrać transakcji');
                return res.json();
            })
            .then((data) => setTransactions(data))
            .catch((err) => console.error(err));


        fetchBalance();
    }, [monthOffset]);

    const changeMonth = (offset) => setMonthOffset((prev) => prev + offset);

    const handleSubmitTransaction = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');


        if (editingTx) {
            const token = localStorage.getItem('token');

            const existingCategory = categories.find(
                (cat) =>
                    cat.name.toLowerCase() === categoryId.trim().toLowerCase() &&
                    cat.type === transactionType
            );

            let category_id = null;

            if (existingCategory) {
                category_id = existingCategory.id;
            } else {
                const newCatRes = await fetch('http://localhost:8000/category', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name: categoryId.trim(), type: transactionType }),
                });

                if (!newCatRes.ok) throw new Error('Nie udało się dodać kategorii');
                const newCategory = await newCatRes.json();
                category_id = newCategory.id;

                const updatedCats = await fetch('http://localhost:8000/category', {
                    headers: { Authorization: `Bearer ${token}` },
                }).then((res) => res.json());
                setCategories(updatedCats);
            }

            const res = await fetch(`http://localhost:8000/transaction/${editingTx.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description,
                    category_id,
                    date: new Date(date).toISOString(),
                })
            });

            if (!res.ok) throw new Error('Błąd edycji transakcji');

            const updatedTx = (await res.json()).transaction;

            setTransactions(prev => {
                const other = prev.filter(tx => tx.id !== editingTx.id);
                return [...other, updatedTx].sort((a, b) => new Date(b.date) - new Date(a.date));
            });

            setEditingTx(null);
            setShowForm(false);
            setAmount('');
            setDescription('');
            setCategoryId('');
            setDate(new Date().toISOString().split('T')[0]);
            fetchBalance();


            const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
            const dateTo = new Date(year, month, 0).toISOString().split('T')[0];

            fetch(`http://localhost:8000/transaction?date_from=${dateFrom}&date_to=${dateTo}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(setTransactions)
                .catch(console.error);
            return;
        }





        const existingCategory = categories.find(
            (cat) => cat.name.toLowerCase() === categoryId.trim().toLowerCase()
                && cat.type === transactionType
        );

        let category_id;

        if (existingCategory) {
            category_id = existingCategory.id;
        } else {
            const newCatRes = await fetch('http://localhost:8000/category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: categoryId.trim(),
                    type: transactionType
                })
            });

            if (!newCatRes.ok) throw new Error('Nie udało się dodać kategorii');

            const newCategory = await newCatRes.json();
            category_id = newCategory.id;

            const updated = await fetch('http://localhost:8000/category', {
                headers: { Authorization: `Bearer ${token}` }
            }).then((res) => res.json());
            setCategories(updated);
        }

        const transactionDate = new Date(date).toISOString();

        const res = await fetch('http://localhost:8000/transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                description,
                category_id,
                date: transactionDate
            })
        });

        if (!res.ok) throw new Error('Błąd dodawania transakcji');

        const newTx = await res.json();
        setTransactions((prev) => {
            const updated = [...prev, newTx];
            return updated.sort((a, b) => new Date(b.date) - new Date(a.date));
        });

        setShowForm(false);
        setAmount('');
        setDescription('');
        setCategoryId('');
        setDate(new Date().toISOString().split('T')[0]);
        fetchBalance();
    };


    return (
        <>
            <div className="flex justify-center items-center gap-4 mb-6">
                <button
                    onClick={() => changeMonth(-1)}
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                >
                    ← Poprzedni
                </button>

                <h3 className="text-lg font-semibold text-gray-800">
                    {new Date(year, month - 1).toLocaleString('pl-PL', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </h3>

                <button
                    onClick={() => changeMonth(1)}
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                >
                    Następny →
                </button>
            </div>

            {balance && (
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div className="bg-green-100 text-green-700 py-2 rounded">
                        <p className="text-sm font-medium">Przychody</p>
                        <p className="text-lg font-bold">{balance.income.toFixed(2)} zł</p>
                    </div>
                    <div className="bg-red-100 text-red-700 py-2 rounded">
                        <p className="text-sm font-medium">Wydatki</p>
                        <p className="text-lg font-bold">{balance.expense.toFixed(2)} zł</p>
                    </div>
                    <div className="bg-blue-100 text-blue-700 py-2 rounded">
                        <p className="text-sm font-medium">Saldo</p>
                        <p className="text-lg font-bold">{balance.balance.toFixed(2)} zł</p>
                    </div>
                </div>
            )}

            <div className="flex justify-center mb-4">
                <button
                    onClick={() => {
                        setShowForm(true);
                        setDate(new Date().toISOString().split('T')[0]);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    ➕ Dodaj transakcję
                </button>
            </div>


            <div className="flex justify-center">
                <div className="w-full max-w-xl">
                    <div className="grid grid-cols-3 font-medium text-gray-600 mb-2 px-2 text-center">
                        <div>Data</div>
                        <div>Kwota</div>
                        <div>Kategoria</div>
                    </div>
                    <ul className="space-y-2">
                        {transactions.map((tx) => (
                            <li
                                key={tx.id}
                                onClick={() => setSelectedTx(tx)}
                                className="cursor-pointer grid grid-cols-3 items-center text-center p-3 rounded border border-gray-200 shadow hover:bg-gray-50 transition text-sm"
                            >
                                <div>{new Date(tx.date).toLocaleDateString()}</div>
                                <div
                                    className={`font-semibold ${tx.category_type === 'income'
                                        ? 'text-green-600'
                                        : 'text-red-500'
                                        }`}
                                >
                                    {tx.amount.toFixed(2)} zł
                                </div>
                                <div className="text-gray-800">{tx.category_name || '—'}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>



            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h4 className="text-lg font-semibold mb-4 text-center">Nowa transakcja</h4>
                        <form onSubmit={handleSubmitTransaction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Typ transakcji</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="expense"
                                            checked={transactionType === 'expense'}
                                            onChange={() => setTransactionType('expense')}
                                        />
                                        <span className="ml-2">Wydatek</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="income"
                                            checked={transactionType === 'income'}
                                            onChange={() => setTransactionType('income')}
                                        />
                                        <span className="ml-2">Przychód</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Kwota</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Opis</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Data</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Kategoria</label>
                                <input
                                    list="category-options"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    placeholder="Wybierz lub wpisz"
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                                <datalist id="category-options">
                                    {categories
                                        .filter((cat) => cat.type === transactionType)
                                        .map((cat) => (
                                            <option key={cat.id} value={cat.name} />
                                        ))}
                                </datalist>
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





            {selectedTx && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h4 className="text-lg font-semibold text-center mb-4">
                            Szczegóły transakcji
                        </h4>
                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span className="font-medium">Data:</span>
                                <span>{new Date(selectedTx.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Kwota:</span>
                                <span
                                    className={`font-bold ${selectedTx.category_type === 'income'
                                        ? 'text-green-600'
                                        : 'text-red-500'
                                        }`}
                                >
                                    {selectedTx.amount.toFixed(2)} zł
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Kategoria:</span>
                                <span>{selectedTx.category_name || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Typ:</span>
                                <span>
                                    {selectedTx.category_type === 'income' ? 'Przychód' : 'Wydatek'}
                                </span>
                            </div>
                            {selectedTx.description && (
                                <div>
                                    <span className="block font-medium">Opis:</span>
                                    <p className="text-gray-600 mt-1">{selectedTx.description}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Zamknij
                            </button>
                            <button
                                onClick={() => {
                                    setEditingTx(selectedTx);
                                    setShowForm(true);
                                    setSelectedTx(null);
                                    setTransactionType(selectedTx.category_type);
                                    setAmount(selectedTx.amount.toString());
                                    setDescription(selectedTx.description || '');
                                    setCategoryId(selectedTx.category_name || '');
                                    setDate(selectedTx.date.split('T')[0]);
                                }}
                                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                                Edytuj
                            </button>

                            <button
                                onClick={async () => {
                                    const confirmed = window.confirm('Na pewno chcesz usunąć tę transakcję?');
                                    if (!confirmed) return;

                                    const token = localStorage.getItem('token');
                                    try {
                                        const res = await fetch(`http://localhost:8000/transaction/${selectedTx.id}`, {
                                            method: 'DELETE',
                                            headers: { Authorization: `Bearer ${token}` }
                                        });

                                        if (!res.ok) throw new Error('Błąd przy usuwaniu transakcji');

                                        setTransactions(prev => prev.filter(tx => tx.id !== selectedTx.id));
                                        setSelectedTx(null);
                                        fetchBalance();
                                    } catch (err) {
                                        alert(err.message);
                                    }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Usuń
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </>
    );
}

export default TransactionsList;
