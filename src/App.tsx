
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ArrowDownLeft, ArrowUpRight,
  Clock, ChartNoAxesCombined, Settings, Plus,
  Wallet, Trash2
} from 'lucide-react'

type Transaction = {
  id: string
  title: string
  category: string
  amount: number
  type: 'income' | 'expense'
  date: string
}

type Pending = {
  id: string
  title: string
  person: string
  expected: number
  received: number
  due: string
}

const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)

export default function App() {
  const [tab, setTab] = useState('Dashboard')
  const [transactions, setTransactions] = useState<Transaction[]>(
    () => JSON.parse(localStorage.getItem('ml_transactions') || '[]')
  )
  const [pending, setPending] = useState<Pending[]>(
    () => JSON.parse(localStorage.getItem('ml_pending') || '[]')
  )

  useEffect(() => {
    localStorage.setItem('ml_transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('ml_pending', JSON.stringify(pending))
  }, [pending])

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense' | 'pending'>('income')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Other')
  const [person, setPerson] = useState('')
  const [due, setDue] = useState('')

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = income - expenses

  const pendingTotal = pending.reduce(
    (sum, p) => sum + p.expected - p.received, 0
  )

  function saveRecord() {
    const value = Number(amount)

    if (!title.trim() || !value || value <= 0) {
      alert('Enter a valid title and amount.')
      return
    }

    if (formType === 'pending') {
      setPending([{
        id: crypto.randomUUID(),
        title,
        person,
        expected: value,
        received: 0,
        due
      }, ...pending])
    } else {
      setTransactions([{
        id: crypto.randomUUID(),
        title,
        category,
        amount: value,
        type: formType,
        date: new Date().toISOString().slice(0, 10)
      }, ...transactions])
    }

    setTitle('')
    setAmount('')
    setPerson('')
    setDue('')
    setShowForm(false)
  }

  function receivePayment(item: Pending) {
    const remaining = item.expected - item.received
    const input = prompt(`Remaining: ${currency(remaining)}. Enter amount received:`)

    if (input === null) return

    const value = Number(input)

    if (!value || value <= 0 || value > remaining) {
      alert('Enter a valid amount.')
      return
    }

    setTransactions([{
      id: crypto.randomUUID(),
      title: `Payment received: ${item.title}`,
      category: 'Pending payment',
      amount: value,
      type: 'income',
      date: new Date().toISOString().slice(0, 10)
    }, ...transactions])

    setPending(pending
      .map(p => p.id === item.id
        ? { ...p, received: p.received + value }
        : p
      )
      .filter(p => p.received < p.expected)
    )
  }

  function openForm(type: 'income' | 'expense' | 'pending') {
    setFormType(type)
    setShowForm(true)
  }

  const nav = [
    ['Dashboard', LayoutDashboard],
    ['Income', ArrowDownLeft],
    ['Expenses', ArrowUpRight],
    ['Pending payments', Clock],
    ['Analytics', ChartNoAxesCombined],
    ['Settings', Settings]
  ] as const

  const visibleTransactions = transactions.filter(t =>
    tab === 'Income' ? t.type === 'income' :
    tab === 'Expenses' ? t.type === 'expense' : true
  )

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">M</span>
          <div>
            <h2>MaxLedger</h2>
            <small>by Sanjay S</small>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        {nav.map(([name, Icon]) => (
          <button
            key={name}
            className={`nav-item ${tab === name ? 'active' : ''}`}
            onClick={() => setTab(name)}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}

        <div className="sidebar-footer">
          <span className="online-dot" /> Saved on this device
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <small>PERSONAL FINANCE</small>
            <h1>{tab}</h1>
          </div>
          <div className="profile">S</div>
        </header>

        {tab === 'Dashboard' && (
          <>
            <section className="welcome">
              <div>
                <h2>Your money, in focus.</h2>
                <p>Track your money with clarity.</p>
              </div>
              <button className="primary" onClick={() => openForm('income')}>
                <Plus size={17} /> Add transaction
              </button>
            </section>

            <section className="stats">
              <div className="stat-card balance-card">
                <span>Total balance</span>
                <h2>{currency(balance)}</h2>
                <small>Income minus expenses</small>
              </div>
              <div className="stat-card">
                <span>Total income</span>
                <h2 className="green">{currency(income)}</h2>
                <small>Actually received</small>
              </div>
              <div className="stat-card">
                <span>Total expenses</span>
                <h2 className="red">{currency(expenses)}</h2>
                <small>Money spent</small>
              </div>
              <div className="stat-card">
                <span>Pending income</span>
                <h2 className="yellow">{currency(pendingTotal)}</h2>
                <small>Not yet received</small>
              </div>
            </section>

            <section className="quick-actions">
              <button onClick={() => openForm('income')}>＋ Add income</button>
              <button onClick={() => openForm('expense')}>＋ Add expense</button>
              <button onClick={() => openForm('pending')}>＋ Pending payment</button>
            </section>
          </>
        )}

        {(tab === 'Dashboard' || tab === 'Income' || tab === 'Expenses') && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Recent transactions</h3>
                <p>Your recorded money activity</p>
              </div>
            </div>

            {visibleTransactions.length === 0 ? (
              <p className="empty">No transactions yet. Add your first record.</p>
            ) : visibleTransactions.map(t => (
              <div className="transaction" key={t.id}>
                <div className={`transaction-icon ${t.type}`}>
                  {t.type === 'income'
                    ? <ArrowDownLeft />
                    : <ArrowUpRight />}
                </div>
                <div className="transaction-info">
                  <b>{t.title}</b>
                  <small>{t.category} · {t.date}</small>
                </div>
                <strong className={t.type}>
                  {t.type === 'income' ? '+' : '−'}{currency(t.amount)}
                </strong>
                <button
                  className="delete"
                  onClick={() => setTransactions(
                    transactions.filter(x => x.id !== t.id)
                  )}
                  aria-label="Delete transaction"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </section>
        )}

        {tab === 'Pending payments' && (
          <section className="panel">
            <div className="panel-heading">
              <h3>Pending payments</h3>
              <button className="primary" onClick={() => openForm('pending')}>
                <Plus size={16} /> Add payment
              </button>
            </div>

            {pending.length === 0 && (
              <p className="empty">No pending payments.</p>
            )}

            {pending.map(p => (
              <div className="pending-item" key={p.id}>
                <div>
                  <b>{p.title}</b>
                  <small>{p.person || 'No customer name'} · Due {p.due || 'Not set'}</small>
                  <small>
                    Received {currency(p.received)} / {currency(p.expected)}
                  </small>
                </div>
                <div>
                  <strong>{currency(p.expected - p.received)}</strong>
                  <button className="text-button" onClick={() => receivePayment(p)}>
                    Add received
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === 'Analytics' && (
          <section className="panel">
            <h3>Financial overview</h3>
            <p>All recorded transactions</p>
            <div className="analytics-row">
              <span>Income</span><b>{currency(income)}</b>
            </div>
            <div className="analytics-row">
              <span>Expenses</span><b>{currency(expenses)}</b>
            </div>
            <div className="analytics-row">
              <span>Balance</span><b>{currency(balance)}</b>
            </div>
          </section>
        )}

        {tab === 'Settings' && (
          <section className="panel">
            <h3>Settings</h3>
            <p>MaxLedger by Sanjay S</p>
            <p className="empty">
              Your current records are stored in this browser on this device.
              Cloud backup and security features will be added in later phases.
            </p>
          </section>
        )}

        <footer>MAXLEDGER · Made for clarity</footer>
      </main>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>
              {formType === 'pending'
                ? 'Add pending payment'
                : `Add ${formType}`}
            </h2>

            <label>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter title"
            />

            {formType === 'pending' ? (
              <>
                <label>Customer / source</label>
                <input
                  value={person}
                  onChange={e => setPerson(e.target.value)}
                  placeholder="Name (optional)"
                />
                <label>Expected date to receive</label>
                <input
                  type="date"
                  value={due}
                  onChange={e => setDue(e.target.value)}
                />
              </>
            ) : (
              <>
                <label>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {['Other', 'Work', 'Food', 'Transport', 'Shopping', 'Bills', 'Salary'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </>
            )}

            <label>Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
            />

            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="primary" onClick={saveRecord}>
                Save record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
            }
