import React, { useState, useEffect } from 'react';

// Note: This is a working prototype. To deploy:
// 1. Initialize Firebase in your project
// 2. Set up Firestore database and Authentication
// 3. Replace the Firebase config below with your own
// 4. Deploy to Firebase Hosting

const RamenInventoryApp = () => {
  const [authUser, setAuthUser] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [transactionType, setTransactionType] = useState('usage');

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
    category: 'Noodles',
  });

  const [transactionData, setTransactionData] = useState({
    ingredientId: '',
    ingredientName: '',
    type: 'usage',
    quantity: '',
    notes: '',
  });

  const categories = ['Noodles', 'Broth', 'Toppings', 'Proteins', 'Vegetables', 'Spices', 'Other'];
  const units = ['pcs', 'kg', 'liters', 'ml', 'grams', 'bundles'];

  // Simulate Firebase auth (replace with real Firebase)
  useEffect(() => {
    const stored = localStorage.getItem('ramenUser');
    if (stored) {
      setAuthUser(JSON.parse(stored));
      loadIngredients();
      loadTransactions();
    }
  }, []);

  const loadIngredients = () => {
    const stored = localStorage.getItem('ramenIngredients');
    if (stored) setIngredients(JSON.parse(stored));
  };

  const loadTransactions = () => {
    const stored = localStorage.getItem('ramenTransactions');
    if (stored) setTransactions(JSON.parse(stored));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const user = { email, id: Date.now() };
    localStorage.setItem('ramenUser', JSON.stringify(user));
    setAuthUser(user);
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('ramenUser');
  };

  const handleAddIngredient = (e) => {
    e.preventDefault();
    const newId = Date.now();
    const newIngredient = {
      id: newId,
      ...formData,
      quantity: parseFloat(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
      totalValue: parseFloat(formData.quantity) * parseFloat(formData.unitPrice),
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      const updated = ingredients.map(i => i.id === editingId ? { ...newIngredient, id: editingId } : i);
      setIngredients(updated);
      localStorage.setItem('ramenIngredients', JSON.stringify(updated));
      setEditingId(null);
    } else {
      const updated = [...ingredients, newIngredient];
      setIngredients(updated);
      localStorage.setItem('ramenIngredients', JSON.stringify(updated));
    }

    setFormData({ name: '', quantity: '', unit: 'kg', unitPrice: '', category: 'Noodles' });
    setShowAddForm(false);
  };

  const handleDeleteIngredient = (id) => {
    const updated = ingredients.filter(i => i.id !== id);
    setIngredients(updated);
    localStorage.setItem('ramenIngredients', JSON.stringify(updated));
  };

  const handleEditIngredient = (ingredient) => {
    setFormData({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      unitPrice: ingredient.unitPrice,
      category: ingredient.category,
    });
    setEditingId(ingredient.id);
    setShowAddForm(true);
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const ingredient = ingredients.find(i => i.id === parseInt(transactionData.ingredientId));
    if (!ingredient) return;

    const newTransaction = {
      id: Date.now(),
      ingredientId: parseInt(transactionData.ingredientId),
      ingredientName: ingredient.name,
      type: transactionData.type,
      quantity: parseFloat(transactionData.quantity),
      unit: ingredient.unit,
      unitPrice: ingredient.unitPrice,
      totalValue: parseFloat(transactionData.quantity) * ingredient.unitPrice,
      notes: transactionData.notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [...transactions, newTransaction];
    setTransactions(updated);
    localStorage.setItem('ramenTransactions', JSON.stringify(updated));

    // Update ingredient quantity
    const updatedIngredients = ingredients.map(i => {
      if (i.id === ingredient.id) {
        const newQty = transactionData.type === 'usage' 
          ? i.quantity - parseFloat(transactionData.quantity)
          : i.quantity + parseFloat(transactionData.quantity);
        return { ...i, quantity: Math.max(0, newQty), totalValue: Math.max(0, newQty) * i.unitPrice };
      }
      return i;
    });
    setIngredients(updatedIngredients);
    localStorage.setItem('ramenIngredients', JSON.stringify(updatedIngredients));

    setTransactionData({ ingredientId: '', ingredientName: '', type: 'usage', quantity: '', notes: '' });
    setShowTransactionForm(false);
  };

  const exportToCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let csv = 'Ramen Restaurant Inventory Export - ' + timestamp + '\n\n';

    csv += 'INVENTORY STATUS\n';
    csv += 'Name,Category,Quantity,Unit,Unit Price,Total Value\n';
    ingredients.forEach(ing => {
      csv += `"${ing.name}","${ing.category}",${ing.quantity},${ing.unit},${ing.unitPrice},${ing.totalValue}\n`;
    });

    csv += '\n\nTRANSACTION HISTORY\n';
    csv += 'Date,Type,Ingredient,Quantity,Unit,Unit Price,Total Value,Notes\n';
    transactions.forEach(trans => {
      const date = new Date(trans.createdAt).toLocaleDateString();
      csv += `"${date}","${trans.type}","${trans.ingredientName}",${trans.quantity},${trans.unit},${trans.unitPrice},${trans.totalValue},"${trans.notes}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ramen-inventory-${timestamp}.csv`;
    a.click();
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || ing.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = ingredients.filter(ing => ing.quantity < 5);
  const totalInventoryValue = ingredients.reduce((sum, ing) => sum + (ing.totalValue || 0), 0);

  if (!authUser) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.logo}>🍜</div>
          <h1 style={styles.title}>Ramen Inventory</h1>
          <p style={styles.subtitle}>Real-time stock tracking for your restaurant</p>
          <form onSubmit={handleLogin} style={styles.loginForm}>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              style={styles.input}
            />
            <button type="submit" style={styles.buttonPrimary}>
              Sign in
            </button>
          </form>
          <p style={styles.demo}>Demo: Use any email to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>🍜</div>
          <h1 style={styles.headerTitle}>Ramen Inventory</h1>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{authUser.email}</span>
          <button onClick={handleLogout} style={styles.buttonSecondary}>Sign out</button>
        </div>
      </header>

      <nav style={styles.nav}>
        {['dashboard', 'inventory', 'transactions', 'settings'].map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              ...styles.navButton,
              ...((activeView === view) ? styles.navButtonActive : {}),
            }}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {activeView === 'dashboard' && (
          <div>
            <h2 style={styles.sectionTitle}>Dashboard</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Items</div>
                <div style={styles.statValue}>{ingredients.length}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Inventory Value</div>
                <div style={styles.statValue}>₱{Math.round(totalInventoryValue).toLocaleString()}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Low Stock Items</div>
                <div style={{ ...styles.statValue, color: '#e8341c' }}>{lowStockItems.length}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Today's Transactions</div>
                <div style={styles.statValue}>{transactions.filter(t => 
                  new Date(t.createdAt).toDateString() === new Date().toDateString()
                ).length}</div>
              </div>
            </div>

            {lowStockItems.length > 0 && (
              <div style={{ ...styles.card, marginTop: '24px', borderLeft: '4px solid #e8341c' }}>
                <h3 style={styles.cardTitle}>⚠️ Low Stock Alert</h3>
                <div style={styles.alertList}>
                  {lowStockItems.map(ing => (
                    <div key={ing.id} style={styles.alertItem}>
                      <span style={styles.alertName}>{ing.name}</span>
                      <span style={styles.alertQty}>{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.actionsGrid}>
              <button 
                onClick={() => { setShowAddForm(true); setEditingId(null); setFormData({ name: '', quantity: '', unit: 'kg', unitPrice: '', category: 'Noodles' }); }}
                style={styles.actionButton}
              >
                ➕ Add Ingredient
              </button>
              <button 
                onClick={() => setShowTransactionForm(true)}
                style={styles.actionButton}
              >
                📝 Record Transaction
              </button>
              <button 
                onClick={exportToCSV}
                style={styles.actionButton}
              >
                📥 Export to CSV
              </button>
            </div>
          </div>
        )}

        {activeView === 'inventory' && (
          <div>
            <h2 style={styles.sectionTitle}>Ingredient Inventory</h2>
            <div style={styles.filterBar}>
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button 
                onClick={() => { setShowAddForm(true); setEditingId(null); setFormData({ name: '', quantity: '', unit: 'kg', unitPrice: '', category: 'Noodles' }); }}
                style={styles.buttonPrimary}
              >
                + Add New
              </button>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableCell}>Name</th>
                    <th style={styles.tableCell}>Category</th>
                    <th style={styles.tableCell}>Qty</th>
                    <th style={styles.tableCell}>Unit</th>
                    <th style={styles.tableCell}>Unit Price</th>
                    <th style={styles.tableCell}>Total Value</th>
                    <th style={styles.tableCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngredients.map(ing => (
                    <tr key={ing.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{ing.name}</td>
                      <td style={styles.tableCell}>{ing.category}</td>
                      <td style={{ ...styles.tableCell, color: ing.quantity < 5 ? '#e8341c' : '#d97706' }}>
                        <strong>{ing.quantity}</strong>
                      </td>
                      <td style={styles.tableCell}>{ing.unit}</td>
                      <td style={styles.tableCell}>₱{ing.unitPrice}</td>
                      <td style={styles.tableCell}>₱{Math.round(ing.totalValue).toLocaleString()}</td>
                      <td style={styles.tableCell}>
                        <button onClick={() => handleEditIngredient(ing)} style={styles.buttonSmall}>✏️ Edit</button>
                        <button onClick={() => handleDeleteIngredient(ing.id)} style={{ ...styles.buttonSmall, marginLeft: '6px' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'transactions' && (
          <div>
            <h2 style={styles.sectionTitle}>Transaction History</h2>
            <button 
              onClick={() => setShowTransactionForm(true)}
              style={{ ...styles.buttonPrimary, marginBottom: '16px' }}
            >
              + Record Transaction
            </button>

            <div style={styles.transactionList}>
              {transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(trans => (
                <div key={trans.id} style={styles.transactionCard}>
                  <div style={styles.transactionHeader}>
                    <span style={{ ...styles.transactionBadge, background: trans.type === 'usage' ? '#fecaca' : '#a7f3d0' }}>
                      {trans.type === 'usage' ? '📤 Usage' : '📥 Delivery'}
                    </span>
                    <span style={styles.transactionDate}>
                      {new Date(trans.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.transactionDetails}>
                    <div><strong>{trans.ingredientName}</strong></div>
                    <div style={styles.transactionQty}>
                      {trans.quantity} {trans.unit} @ ₱{trans.unitPrice}
                    </div>
                    <div style={styles.transactionValue}>
                      Total: ₱{Math.round(trans.totalValue).toLocaleString()}
                    </div>
                    {trans.notes && <div style={styles.transactionNotes}>Note: {trans.notes}</div>}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p style={styles.emptyState}>No transactions yet. Start by recording ingredient usage or delivery.</p>
              )}
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div>
            <h2 style={styles.sectionTitle}>Settings</h2>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Account</h3>
              <p>Logged in as: <strong>{authUser.email}</strong></p>
              <button onClick={handleLogout} style={{ ...styles.buttonSecondary, marginTop: '16px' }}>Sign out</button>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Data Management</h3>
              <p>Total ingredients: {ingredients.length}</p>
              <p>Total transactions: {transactions.length}</p>
              <button onClick={exportToCSV} style={{ ...styles.buttonPrimary, marginTop: '16px' }}>
                📥 Export All Data to CSV
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Ingredient Form Modal */}
      {showAddForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{editingId ? 'Edit Ingredient' : 'Add New Ingredient'}</h2>
              <button onClick={() => { setShowAddForm(false); setEditingId(null); }} style={styles.closeButton}>✕</button>
            </div>
            <form onSubmit={handleAddIngredient} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ingredient Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                  required
                  placeholder="e.g., Tonkotsu Broth"
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    style={styles.input}
                    required
                    placeholder="0"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit *</label>
                  <select 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={styles.input}
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit Price (₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    style={styles.input}
                    required
                    placeholder="0"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={styles.input}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.formButtons}>
                <button type="submit" style={styles.buttonPrimary}>
                  {editingId ? 'Update Ingredient' : 'Add Ingredient'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowAddForm(false); setEditingId(null); }}
                  style={styles.buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Record Transaction</h2>
              <button onClick={() => setShowTransactionForm(false)} style={styles.closeButton}>✕</button>
            </div>
            <form onSubmit={handleAddTransaction} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Transaction Type *</label>
                <div style={styles.radioGroup}>
                  <label>
                    <input
                      type="radio"
                      value="usage"
                      checked={transactionData.type === 'usage'}
                      onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value })}
                    />
                    📤 Usage (Remove from stock)
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="delivery"
                      checked={transactionData.type === 'delivery'}
                      onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value })}
                    />
                    📥 Delivery (Add to stock)
                  </label>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ingredient *</label>
                <select 
                  value={transactionData.ingredientId}
                  onChange={(e) => setTransactionData({ ...transactionData, ingredientId: e.target.value })}
                  style={styles.input}
                  required
                >
                  <option value="">Select an ingredient</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({ ...transactionData, quantity: e.target.value })}
                  style={styles.input}
                  required
                  placeholder="0"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={transactionData.notes}
                  onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px', fontFamily: 'inherit' }}
                  placeholder="Optional notes about this transaction"
                />
              </div>
              <div style={styles.formButtons}>
                <button type="submit" style={styles.buttonPrimary}>Record Transaction</button>
                <button 
                  type="button" 
                  onClick={() => setShowTransactionForm(false)}
                  style={styles.buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#faf9f7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
    padding: '20px',
  },
  loginCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px 32px',
    maxWidth: '360px',
    width: '100%',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  logo: {
    fontSize: '56px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: '32px',
    fontSize: '14px',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  demo: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '16px',
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userEmail: {
    fontSize: '14px',
    color: '#6b7280',
  },
  nav: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    gap: 0,
    overflow: 'auto',
    padding: '0 24px',
  },
  navButton: {
    background: 'none',
    border: 'none',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  navButtonActive: {
    color: '#d97706',
    borderBottomColor: '#d97706',
  },
  main: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
    margin: '0 0 20px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#d97706',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 12px 0',
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  alertItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#fff5f3',
    borderRadius: '8px',
  },
  alertName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  alertQty: {
    fontSize: '14px',
    color: '#e8341c',
    fontWeight: '600',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '24px',
  },
  actionButton: {
    background: '#f59e0b',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 16px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: '1',
    minWidth: '200px',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  filterSelect: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '140px',
  },
  tableContainer: {
    overflowX: 'auto',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
  },
  tableCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '14px',
  },
  transactionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  transactionCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
  },
  transactionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  transactionBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#1f2937',
  },
  transactionDate: {
    fontSize: '12px',
    color: '#6b7280',
  },
  transactionDetails: {
    fontSize: '14px',
  },
  transactionQty: {
    color: '#6b7280',
    marginTop: '4px',
  },
  transactionValue: {
    fontWeight: '600',
    color: '#d97706',
    marginTop: '4px',
  },
  transactionNotes: {
    color: '#6b7280',
    marginTop: '8px',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  emptyState: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '40px 20px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  form: {
    padding: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '20px',
  },
  buttonPrimary: {
    background: '#d97706',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonSecondary: {
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '10px 16px',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonSmall: {
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default RamenInventoryApp;
