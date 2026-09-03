import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

const ADMIN_EMAIL = 'jeanneacosta@yahoo.com';

const RamenInventoryApp = () => {
  const [authUser, setAuthUser] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showQuickSell, setShowQuickSell] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
    category: 'Noodles',
  });
  const [recipeData, setRecipeData] = useState({
    name: '',
    price: '',
    ingredients: [],
  });
  const [quickSellData, setQuickSellData] = useState({
    recipeId: '',
    quantity: '1',
  });
  const [expenseData, setExpenseData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  // ============ AUTH HANDLERS ============
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user);
        setShowLoginForm(false);
        loadFirestoreData(user.uid);
        loadRecipes();
        loadSales();
        loadExpenses();
        setLoading(false);
      } else {
        setAuthUser(null);
        setShowLoginForm(true);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const email = e.target.email.value;
      const password = e.target.password.value;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError('Login failed: ' + error.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const email = e.target.email.value;
      const password = e.target.password.value;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      setError('Registration failed: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ============ LOAD DEMO DATA ============
  const loadDemoData = async () => {
    if (!window.confirm('Load 37 ingredients + 5 recipes? This will add all demo data.')) {
      return;
    }

    try {
      setError('Loading demo data... please wait');

      const ingredientsList = [
        { name: 'Tonkatsu Broth', quantity: 3.5, unit: 'liters', unitPrice: 150, category: 'Broth' },
        { name: 'Curry Sauce', quantity: 450, unit: 'ml', unitPrice: 80, category: 'Broth' },
        { name: 'Miso Paste', quantity: 50, unit: 'ml', unitPrice: 100, category: 'Broth' },
        { name: 'Shoyu Sauce', quantity: 6, unit: 'liters', unitPrice: 120, category: 'Broth' },
        { name: 'Noodle Sauce', quantity: 1, unit: 'liters', unitPrice: 200, category: 'Broth' },
        { name: 'Gyoza Sauce', quantity: 450, unit: 'ml', unitPrice: 90, category: 'Broth' },
        { name: 'Ramen Noodles', quantity: 0.6, unit: 'kg', unitPrice: 500, category: 'Noodles' },
        { name: 'Yakisoba', quantity: 4, unit: 'kg', unitPrice: 400, category: 'Noodles' },
        { name: 'Gyoza', quantity: 450, unit: 'pcs', unitPrice: 2, category: 'Proteins' },
        { name: 'Eggs/Tamago', quantity: 6, unit: 'pcs', unitPrice: 30, category: 'Proteins' },
        { name: 'Chashu Bits', quantity: 0, unit: 'g', unitPrice: 50, category: 'Proteins' },
        { name: 'Chashu Pork', quantity: 13, unit: 'kg', unitPrice: 800, category: 'Proteins' },
        { name: 'Black Garlic', quantity: 630, unit: 'g', unitPrice: 15, category: 'Vegetables' },
        { name: 'Seaweeds Strip Nori', quantity: 140, unit: 'g', unitPrice: 50, category: 'Vegetables' },
        { name: 'Black Fungus/Kikurage', quantity: 350, unit: 'g', unitPrice: 20, category: 'Vegetables' },
        { name: 'Wakame Seaweeds', quantity: 930, unit: 'g', unitPrice: 10, category: 'Vegetables' },
        { name: 'Black Sesame Seeds', quantity: 180, unit: 'g', unitPrice: 25, category: 'Vegetables' },
        { name: 'Vegetable Oil', quantity: 700, unit: 'ml', unitPrice: 80, category: 'Spices' },
        { name: 'Sesame Oil', quantity: 115, unit: 'ml', unitPrice: 200, category: 'Spices' },
        { name: 'Capsaicin', quantity: 500, unit: 'g', unitPrice: 30, category: 'Spices' },
        { name: 'Chili Oil', quantity: 220, unit: 'ml', unitPrice: 150, category: 'Spices' },
        { name: 'Red Pepper', quantity: 280, unit: 'g', unitPrice: 40, category: 'Spices' },
        { name: 'Take-Out Paper Box', quantity: 1000, unit: 'pcs', unitPrice: 1, category: 'Other' },
        { name: 'Take-out Bowls', quantity: 37, unit: 'pcs', unitPrice: 5, category: 'Other' },
        { name: 'Chopsticks wood disp', quantity: 150, unit: 'pcs', unitPrice: 0.5, category: 'Other' },
        { name: 'Ramen soup spoon disp', quantity: 24, unit: 'pcs', unitPrice: 2, category: 'Other' },
        { name: 'Disposable gloves', quantity: 0.5, unit: 'box', unitPrice: 50, category: 'Other' },
        { name: 'Coke', quantity: 12, unit: 'pcs', unitPrice: 40, category: 'Other' },
        { name: 'Sprite', quantity: 28, unit: 'pcs', unitPrice: 40, category: 'Other' },
        { name: 'Royal', quantity: 11, unit: 'pcs', unitPrice: 30, category: 'Other' },
        { name: 'Pepsi', quantity: 23, unit: 'pcs', unitPrice: 40, category: 'Other' },
        { name: 'Mountain Dew', quantity: 20, unit: 'pcs', unitPrice: 50, category: 'Other' },
        { name: 'Bottled Water', quantity: 15, unit: 'pcs', unitPrice: 20, category: 'Other' },
        { name: 'Gasul', quantity: 1, unit: 'full', unitPrice: 200, category: 'Other' },
        { name: 'Butane', quantity: 2, unit: 'pcs', unitPrice: 100, category: 'Other' },
        { name: 'Sando Bag', quantity: 1, unit: 'box', unitPrice: 150, category: 'Other' },
        { name: 'Water Blue Jag', quantity: 1, unit: 'pcs', unitPrice: 200, category: 'Other' },
        { name: 'Paper Tissue', quantity: 2, unit: 'box', unitPrice: 100, category: 'Other' },
      ];

      for (const ing of ingredientsList) {
        await addDoc(collection(db, 'ingredients'), {
          ...ing,
          totalValue: ing.quantity * ing.unitPrice,
          userId: authUser.uid,
          createdAt: serverTimestamp(),
        });
      }

      const recipesList = [
        {
          name: 'Tonkatsu Ramen',
          price: 350,
          ingredients: [
            { ingredientName: 'Ramen Noodles', quantity: 0.2, unit: 'kg' },
            { ingredientName: 'Tonkatsu Broth', quantity: 0.3, unit: 'liters' },
            { ingredientName: 'Chashu Pork', quantity: 0.05, unit: 'kg' },
            { ingredientName: 'Eggs/Tamago', quantity: 1, unit: 'pcs' },
          ]
        },
        {
          name: 'Tantan Ramen',
          price: 315,
          ingredients: [
            { ingredientName: 'Ramen Noodles', quantity: 0.2, unit: 'kg' },
            { ingredientName: 'Curry Sauce', quantity: 0.15, unit: 'liters' },
            { ingredientName: 'Eggs/Tamago', quantity: 1, unit: 'pcs' },
          ]
        },
        {
          name: 'Shoyu Ramen',
          price: 315,
          ingredients: [
            { ingredientName: 'Ramen Noodles', quantity: 0.2, unit: 'kg' },
            { ingredientName: 'Shoyu Sauce', quantity: 0.3, unit: 'liters' },
            { ingredientName: 'Eggs/Tamago', quantity: 1, unit: 'pcs' },
          ]
        },
        {
          name: 'Miso Ramen',
          price: 300,
          ingredients: [
            { ingredientName: 'Ramen Noodles', quantity: 0.2, unit: 'kg' },
            { ingredientName: 'Miso Paste', quantity: 0.1, unit: 'liters' },
            { ingredientName: 'Eggs/Tamago', quantity: 1, unit: 'pcs' },
          ]
        },
        {
          name: 'Gyoza',
          price: 150,
          ingredients: [
            { ingredientName: 'Gyoza', quantity: 5, unit: 'pcs' },
            { ingredientName: 'Vegetable Oil', quantity: 20, unit: 'ml' },
          ]
        },
      ];

      for (const recipe of recipesList) {
        await addDoc(collection(db, 'recipes'), {
          ...recipe,
          createdAt: serverTimestamp(),
        });
      }

      setError('');
      alert('✅ SUCCESS!\n\n37 ingredients + 5 recipes loaded!\n\nRefreshing app...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError('Error loading data: ' + err.message);
      console.error(err);
    }
  };

  // ============ PROFIT CALCULATION ============
  const calculateRecipeCost = (recipeIngredients) => {
    let totalCost = 0;
    recipeIngredients.forEach((recipeIng) => {
      const inventoryIng = ingredients.find(i => i.name === recipeIng.ingredientName);
      if (inventoryIng) {
        totalCost += inventoryIng.unitPrice * parseFloat(recipeIng.quantity);
      }
    });
    return totalCost;
  };

  const getRecipeProfit = (recipe) => {
    const cost = calculateRecipeCost(recipe.ingredients);
    const profit = recipe.price - cost;
    const margin = recipe.price > 0 ? (profit / recipe.price * 100).toFixed(1) : 0;
    return { cost, profit, margin };
  };

  // ============ LOAD DATA ============
  const loadFirestoreData = (userId) => {
    const q = query(collection(db, 'ingredients'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        totalValue: doc.data().quantity * doc.data().unitPrice,
        ...doc.data(),
      }));
      setIngredients(data);
    });
    return unsubscribe;
  };

  const loadRecipes = () => {
    const unsubscribe = onSnapshot(collection(db, 'recipes'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecipes(data);
    });
    return unsubscribe;
  };

  const loadTransactions = (userId) => {
    const q = query(collection(db, 'transactions'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(data);
    });
    return unsubscribe;
  };

  const loadSales = () => {
    const unsubscribe = onSnapshot(collection(db, 'sales'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSales(data);
    });
    return unsubscribe;
  };

  const loadExpenses = () => {
    const unsubscribe = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(data);
    });
    return unsubscribe;
  };

  useEffect(() => {
    if (authUser) {
      loadTransactions(authUser.uid);
    }
  }, [authUser]);

  // ============ QUICK SELL HANDLER ============
  const handleQuickSell = async (e) => {
    e.preventDefault();
    setError('');

    const recipe = recipes.find((r) => r.id === quickSellData.recipeId);
    if (!recipe) {
      setError('Please select a ramen type');
      return;
    }

    try {
      const quantitySold = parseInt(quickSellData.quantity);

      await addDoc(collection(db, 'sales'), {
        recipeId: recipe.id,
        recipeName: recipe.name,
        quantity: quantitySold,
        price: recipe.price,
        totalPrice: recipe.price * quantitySold,
        createdAt: serverTimestamp(),
      });

      for (const recipeIngredient of recipe.ingredients) {
        const matchingIngredient = ingredients.find(
          (i) => i.name === recipeIngredient.ingredientName
        );

        if (matchingIngredient) {
          const totalToRemove = parseFloat(recipeIngredient.quantity) * quantitySold;
          const newQuantity = matchingIngredient.quantity - totalToRemove;

          await updateDoc(doc(db, 'ingredients', matchingIngredient.id), {
            quantity: newQuantity,
            totalValue: newQuantity * matchingIngredient.unitPrice,
          });

          await addDoc(collection(db, 'transactions'), {
            type: 'usage',
            ingredientName: matchingIngredient.name,
            quantity: totalToRemove,
            unit: matchingIngredient.unit,
            unitPrice: matchingIngredient.unitPrice,
            totalValue: totalToRemove * matchingIngredient.unitPrice,
            notes: `Used for ${quantitySold}x ${recipe.name}`,
            userId: authUser.id,
            createdAt: serverTimestamp(),
          });
        }
      }

      setQuickSellData({ recipeId: '', quantity: '1' });
      setShowQuickSell(false);
    } catch (error) {
      setError('Error recording sale: ' + error.message);
    }
  };

  // ============ EXPENSE HANDLERS ============
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await addDoc(collection(db, 'expenses'), {
        category: expenseData.category,
        amount: parseFloat(expenseData.amount),
        date: expenseData.date,
        createdAt: serverTimestamp(),
      });

      setExpenseData({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      });
      setShowAddExpense(false);
    } catch (error) {
      setError('Error adding expense: ' + error.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      setError('Error deleting expense: ' + error.message);
    }
  };

  // ============ INGREDIENT HANDLERS ============
  const handleAddIngredient = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.quantity || !formData.unitPrice) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const ingredientData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        totalValue: parseFloat(formData.quantity) * parseFloat(formData.unitPrice),
        userId: authUser.id,
        createdAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'ingredients', editingId), ingredientData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'ingredients'), ingredientData);
      }

      setFormData({ name: '', quantity: '', unit: 'kg', unitPrice: '', category: 'Noodles' });
      setShowAddForm(false);
    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  const handleEditIngredient = (ing) => {
    setFormData({
      name: ing.name,
      quantity: ing.quantity.toString(),
      unit: ing.unit,
      unitPrice: ing.unitPrice.toString(),
      category: ing.category,
    });
    setEditingId(ing.id);
    setShowAddForm(true);
  };

  const handleDeleteIngredient = async (id) => {
    if (!window.confirm('Delete this ingredient?')) return;
    try {
      await deleteDoc(doc(db, 'ingredients', id));
    } catch (error) {
      setError('Error deleting ingredient: ' + error.message);
    }
  };

  // ============ RECIPE HANDLERS ============
  const handleAddRecipe = async (e) => {
    e.preventDefault();
    setError('');

    if (!recipeData.name || !recipeData.price || recipeData.ingredients.length === 0) {
      setError('Fill in all fields and add at least one ingredient');
      return;
    }

    try {
      if (editingRecipeId) {
        await updateDoc(doc(db, 'recipes', editingRecipeId), recipeData);
        setEditingRecipeId(null);
      } else {
        await addDoc(collection(db, 'recipes'), {
          ...recipeData,
          price: parseFloat(recipeData.price),
          createdAt: serverTimestamp(),
        });
      }

      setRecipeData({ name: '', price: '', ingredients: [] });
      setShowRecipeForm(false);
    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  const handleAddIngredientToRecipe = () => {
    setRecipeData({
      ...recipeData,
      ingredients: [
        ...recipeData.ingredients,
        { ingredientName: '', quantity: '', unit: 'kg' },
      ],
    });
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await deleteDoc(doc(db, 'recipes', id));
    } catch (error) {
      setError('Error deleting recipe: ' + error.message);
    }
  };

  const handleEditRecipe = (recipe) => {
    setRecipeData({
      name: recipe.name,
      price: recipe.price.toString(),
      ingredients: recipe.ingredients,
    });
    setEditingRecipeId(recipe.id);
    setShowRecipeForm(true);
  };

  // ============ STATS CALCULATION ============
  const totalSalesToday = sales
    .filter((s) => new Date(s.createdAt.toDate()).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + (s.price * s.quantity), 0);

  const totalRamenSoldToday = sales
    .filter((s) => new Date(s.createdAt.toDate()).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.quantity, 0);

  const totalInventoryValue = ingredients.reduce((sum, ing) => sum + ing.totalValue, 0);

  const lowStockItems = ingredients.filter((ing) => ing.quantity < 5);

  // ============ FILTERS ============
  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || ing.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // ============ EXPORT TO CSV ============
  const exportToCSV = () => {
    let csv = 'Ingredient,Category,Quantity,Unit,Unit Price,Total Value\n';
    ingredients.forEach((ing) => {
      csv += `${ing.name},${ing.category},${ing.quantity},${ing.unit},${ing.unitPrice},${ing.totalValue}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
  };

  // ============ RENDER ============
  if (loading) {
    return <div style={styles.loadingContainer}>Loading app...</div>;
  }

  if (showLoginForm) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={{ color: '#d97706', marginBottom: '24px' }}>🍜 Ramen Tracker</h1>

          {error && <div style={styles.errorAlert}>{error}</div>}

          {isRegistering ? (
            <form onSubmit={handleRegister}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" name="email" style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input type="password" name="password" style={styles.input} required />
              </div>
              <button type="submit" style={styles.buttonPrimary}>
                Register
              </button>
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                style={styles.buttonSecondary}
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" name="email" style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input type="password" name="password" style={styles.input} required />
              </div>
              <button type="submit" style={styles.buttonPrimary}>
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                style={styles.buttonSecondary}
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>🍜 Ramen Inventory Tracker</h1>
          <div style={styles.headerRight}>
            {authUser && (
              <>
                <span style={styles.userInfo}>
                  {authUser.email}
                  {authUser.email === ADMIN_EMAIL && <span> 👨‍💼 Admin</span>}
                </span>
                <button onClick={handleLogout} style={styles.buttonSecondary}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <nav style={styles.nav}>
        {['dashboard', 'ingredients', 'recipes', 'daily-sales', 'transactions', 'settings'].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              ...styles.navButton,
              ...(activeView === view ? styles.navButtonActive : {}),
            }}
          >
            {view === 'daily-sales' ? '📊 Daily Sales' : view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {error && <div style={styles.errorAlert}>{error}</div>}

        {activeView === 'dashboard' && (
          <div>
            <h2 style={styles.sectionTitle}>📊 Dashboard</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>💵 Today's Revenue</div>
                <div style={styles.statValue}>₱{Math.round(totalSalesToday).toLocaleString()}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>🍜 Ramen Sold Today</div>
                <div style={styles.statValue}>{totalRamenSoldToday}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>💚 Today's Profit</div>
                <div style={{ ...styles.statValue, color: '#16a34a' }}>
                  ₱{(() => {
                    let totalProfit = 0;
                    sales
                      .filter((s) => new Date(s.createdAt.toDate()).toDateString() === new Date().toDateString())
                      .forEach((sale) => {
                        const recipe = recipes.find(r => r.id === sale.recipeId);
                        if (recipe) {
                          const { profit } = getRecipeProfit(recipe);
                          totalProfit += profit * sale.quantity;
                        }
                      });
                    return Math.round(totalProfit).toLocaleString();
                  })()}
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>⚠️ Low Stock Items</div>
                <div style={{ ...styles.statValue, color: '#e8341c' }}>{lowStockItems.length}</div>
              </div>
            </div>

            {totalRamenSoldToday > 0 && (
              <div style={{ ...styles.card, marginTop: '24px', borderLeft: '4px solid #16a34a' }}>
                <h3 style={styles.cardTitle}>💚 Today's Profit Breakdown</h3>
                <div style={{ marginTop: '12px' }}>
                  {recipes.map((recipe) => {
                    const salesOfThisRecipe = sales.filter(
                      (s) => s.recipeId === recipe.id && 
                        new Date(s.createdAt.toDate()).toDateString() === new Date().toDateString()
                    );
                    
                    if (salesOfThisRecipe.length === 0) return null;

                    const { profit } = getRecipeProfit(recipe);
                    const quantitySold = salesOfThisRecipe.reduce((sum, s) => sum + s.quantity, 0);
                    const totalProfitForRecipe = profit * quantitySold;

                    return (
                      <div key={recipe.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #86efac'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>
                            {recipe.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {quantitySold} sold × ₱{profit.toFixed(2)} profit each
                          </div>
                        </div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#16a34a'
                        }}>
                          ₱{totalProfitForRecipe.toFixed(2).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={styles.actionsGrid}>
              <button
                onClick={() => setShowQuickSell(true)}
                style={{ ...styles.actionButton, background: '#10b981' }}
              >
                🛒 Quick Sell Ramen
              </button>
              <button onClick={exportToCSV} style={styles.actionButton}>
                📥 Export to CSV
              </button>
            </div>

            {lowStockItems.length > 0 && (
              <div style={{ ...styles.card, marginTop: '24px', borderLeft: '4px solid #e8341c' }}>
                <h3 style={styles.cardTitle}>⚠️ Low Stock Alert</h3>
                <div style={styles.alertList}>
                  {lowStockItems.map((ing) => (
                    <div key={ing.id} style={styles.alertItem}>
                      <span style={styles.alertName}>{ing.name}</span>
                      <span style={styles.alertQty}>{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'ingredients' && (
          <div>
            <h2 style={styles.sectionTitle}>Ingredients</h2>

            <div style={styles.filtersContainer}>
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
                style={styles.selectInput}
              >
                <option value="all">All Categories</option>
                <option value="Noodles">Noodles</option>
                <option value="Broth">Broth</option>
                <option value="Toppings">Toppings</option>
                <option value="Proteins">Proteins</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Spices">Spices</option>
                <option value="Other">Other</option>
              </select>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingId(null);
                  setFormData({ name: '', quantity: '', unit: 'kg', unitPrice: '', category: 'Noodles' });
                }}
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
                  {filteredIngredients.map((ing) => (
                    <tr key={ing.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{ing.name}</td>
                      <td style={styles.tableCell}>{ing.category}</td>
                      <td
                        style={{
                          ...styles.tableCell,
                          color: ing.quantity < 5 ? '#e8341c' : '#d97706',
                        }}
                      >
                        <strong>{ing.quantity}</strong>
                      </td>
                      <td style={styles.tableCell}>{ing.unit}</td>
                      <td style={styles.tableCell}>₱{ing.unitPrice}</td>
                      <td style={styles.tableCell}>₱{Math.round(ing.totalValue).toLocaleString()}</td>
                      <td style={styles.tableCell}>
                        <button onClick={() => handleEditIngredient(ing)} style={styles.buttonSmall}>
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteIngredient(ing.id)}
                          style={{ ...styles.buttonSmall, marginLeft: '6px' }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'recipes' && (
          <div>
            <h2 style={styles.sectionTitle}>Recipes</h2>

            {authUser && authUser.email === ADMIN_EMAIL && (
              <button
                onClick={() => {
                  setShowRecipeForm(true);
                  setEditingRecipeId(null);
                  setRecipeData({ name: '', price: '', ingredients: [] });
                }}
                style={styles.buttonPrimary}
              >
                + Create Recipe
              </button>
            )}

            <div style={styles.recipesGrid}>
              {recipes.map((recipe) => {
                const { cost, profit, margin } = getRecipeProfit(recipe);
                const isProfitable = profit > 0;
                
                return (
                  <div key={recipe.id} style={styles.recipeCard}>
                    <h3 style={styles.recipeTitle}>{recipe.name}</h3>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <div style={styles.priceLabel}>Selling Price</div>
                      <div style={styles.recipePrice}>₱{recipe.price}</div>
                    </div>

                    <div style={{ ...styles.ingredientsList, marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        <strong>📊 Profit Breakdown:</strong>
                      </div>
                      <div style={{ fontSize: '13px', marginBottom: '4px', color: '#1f2937' }}>
                        💰 Price: <strong>₱{recipe.price}</strong>
                      </div>
                      <div style={{ fontSize: '13px', marginBottom: '4px', color: '#6b7280' }}>
                        📦 Cost: <strong>₱{cost.toFixed(2)}</strong>
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        marginTop: '8px', 
                        padding: '8px', 
                        background: isProfitable ? '#dcfce7' : '#fee2e2',
                        borderRadius: '6px',
                        color: isProfitable ? '#166534' : '#991b1b'
                      }}>
                        💚 <strong>Your Profit: ₱{profit.toFixed(2)}</strong>
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>
                          {margin}% margin
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.ingredientsList, marginBottom: '12px' }}>
                      <strong style={{ fontSize: '12px' }}>Ingredients:</strong>
                      {recipe.ingredients.map((ing, idx) => (
                        <div key={idx} style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          • {ing.quantity} {ing.unit} {ing.ingredientName}
                        </div>
                      ))}
                    </div>

                    {authUser.email === ADMIN_EMAIL && (
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleEditRecipe(recipe)}
                          style={{ ...styles.buttonSmall, marginRight: '8px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          style={styles.buttonSmall}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'daily-sales' && (
          <div>
            <h2 style={styles.sectionTitle}>📊 Daily Sales & Expenses</h2>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>💵 Today's Revenue</div>
                <div style={styles.statValue}>₱{Math.round(
                  sales
                    .filter((s) => new Date(s.createdAt.toDate()).toDateString() === new Date().toDateString())
                    .reduce((sum, s) => sum + (s.price * s.quantity), 0)
                ).toLocaleString()}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>💸 Today's Expenses</div>
                <div style={styles.statValue}>₱{Math.round(
                  expenses
                    .filter((e) => e.date === new Date().toISOString().split('T')[0])
                    .reduce((sum, e) => sum + e.amount, 0)
                ).toLocaleString()}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>💚 Net Profit Today</div>
                <div style={{ ...styles.statValue, color: '#16a34a' }}>₱{Math.round(
                  sales
                    .filter((s) => new Date(s.createdAt.toDate()).toDateString() === new Date().toDateString())
                    .reduce((sum, s) => sum + (s.price * s.quantity), 0) -
                  expenses
                    .filter((e) => e.date === new Date().toISOString().split('T')[0])
                    .reduce((sum, e) => sum + e.amount, 0)
                ).toLocaleString()}</div>
              </div>
            </div>

            {sales.filter((s) => new Date(s.createdAt.toDate()).toDateString() === new Date().toDateString()).length > 0 && (
              <div style={{ ...styles.card, marginTop: '24px' }}>
                <h3 style={styles.cardTitle}>🍜 Sales by Ramen Type</h3>
                <div style={styles.transactionList}>
                  {sales
                    .filter((s) => new Date(s.createdAt.toDate()).toDateString() === new Date().toDateString())
                    .map((sale) => (
                      <div key={sale.id} style={styles.transactionCard}>
                        <div style={styles.transactionHeader}>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>
                            {sale.recipeName}
                          </span>
                          <span style={styles.transactionDate}>
                            {new Date(sale.createdAt.toDate()).toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={styles.transactionDetails}>
                          <div style={styles.transactionQty}>
                            {sale.quantity} × ₱{sale.price} = ₱{(sale.quantity * sale.price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div style={{ ...styles.card, marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={styles.cardTitle}>💸 Daily Expenses</h3>
                <button
                  onClick={() => setShowAddExpense(true)}
                  style={styles.buttonPrimary}
                >
                  + Add Expense
                </button>
              </div>

              {expenses
                .filter((e) => e.date === new Date().toISOString().split('T')[0])
                .length > 0 ? (
                <div style={styles.transactionList}>
                  {expenses
                    .filter((e) => e.date === new Date().toISOString().split('T')[0])
                    .map((expense) => (
                      <div key={expense.id} style={styles.transactionCard}>
                        <div style={styles.transactionHeader}>
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>
                            {expense.category}
                          </span>
                          <span style={styles.transactionDate}>
                            {expense.date}
                          </span>
                        </div>
                        <div style={styles.transactionDetails}>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                            ₱{expense.amount.toLocaleString()}
                          </div>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            style={{ ...styles.buttonSmall, marginTop: '8px', background: '#fee2e2', color: '#991b1b' }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  <div style={{
                    padding: '12px',
                    marginTop: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#b45309'
                  }}>
                    Total Expenses: ₱{expenses
                      .filter((e) => e.date === new Date().toISOString().split('T')[0])
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString()}
                  </div>
                </div>
              ) : (
                <p style={styles.emptyState}>No expenses today.</p>
              )}
            </div>
          </div>
        )}

        {activeView === 'transactions' && (
          <div>
            <h2 style={styles.sectionTitle}>Transaction History</h2>

            <div style={styles.transactionList}>
              {transactions
                .sort((a, b) => new Date(b.createdAt.toDate()) - new Date(a.createdAt.toDate()))
                .map((trans) => (
                  <div key={trans.id} style={styles.transactionCard}>
                    <div style={styles.transactionHeader}>
                      <span
                        style={{
                          ...styles.transactionBadge,
                          background: trans.type === 'usage' ? '#fecaca' : '#a7f3d0',
                        }}
                      >
                        {trans.type === 'usage' ? '📤 Usage' : '📥 Delivery'}
                      </span>
                      <span style={styles.transactionDate}>
                        {new Date(trans.createdAt.toDate()).toLocaleString()}
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
                <p style={styles.emptyState}>No transactions yet.</p>
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
              {authUser.email === ADMIN_EMAIL && <p><strong>👨‍💼 Admin Account</strong></p>}
              <button onClick={handleLogout} style={{ ...styles.buttonSecondary, marginTop: '16px' }}>
                Sign out
              </button>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Data</h3>
              <p>Ingredients: {ingredients.length}</p>
              <p>Recipes: {recipes.length}</p>
              <p>Transactions: {transactions.length}</p>
              <p>Expenses: {expenses.length}</p>
              <p>Sales Records: {sales.length}</p>
              
              {authUser.email === ADMIN_EMAIL && ingredients.length < 10 && (
                <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '6px', marginTop: '16px', marginBottom: '16px' }}>
                  <p style={{ marginTop: 0, color: '#b45309', fontWeight: 'bold' }}>
                    ⚠️ No demo data loaded yet!
                  </p>
                  <button 
                    onClick={loadDemoData}
                    style={{ ...styles.buttonPrimary, background: '#d97706', width: '100%' }}
                  >
                    📥 Load Demo Data (37 ingredients + 5 recipes)
                  </button>
                </div>
              )}
              
              <button onClick={exportToCSV} style={{ ...styles.buttonPrimary, marginTop: '16px' }}>
                📥 Export All Data
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add Ingredient Modal */}
      {showAddForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{editingId ? 'Edit Ingredient' : 'Add Ingredient'}</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddIngredient} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Quantity *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={styles.input}
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="ml">ml</option>
                    <option value="grams">grams</option>
                    <option value="bundles">bundles</option>
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={styles.input}
                  >
                    <option value="Noodles">Noodles</option>
                    <option value="Broth">Broth</option>
                    <option value="Toppings">Toppings</option>
                    <option value="Proteins">Proteins</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Spices">Spices</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div style={styles.formButtons}>
                <button type="submit" style={styles.buttonPrimary}>
                  {editingId ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                  }}
                  style={styles.buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Form Modal */}
      {showRecipeForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{editingRecipeId ? 'Edit Recipe' : 'Create Recipe'}</h2>
              <button onClick={() => setShowRecipeForm(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddRecipe} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Recipe Name *</label>
                <input
                  type="text"
                  value={recipeData.name}
                  onChange={(e) => setRecipeData({ ...recipeData, name: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={recipeData.price}
                  onChange={(e) => setRecipeData({ ...recipeData, price: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ingredients</label>
                {recipeData.ingredients.map((ing, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', padding: '12px', background: '#f3f4f6', borderRadius: '6px' }}>
                    <select
                      value={ing.ingredientName}
                      onChange={(e) => {
                        const newIngredients = [...recipeData.ingredients];
                        const selectedIng = ingredients.find(i => i.name === e.target.value);
                        newIngredients[idx] = {
                          ...newIngredients[idx],
                          ingredientName: e.target.value,
                          unit: selectedIng ? selectedIng.unit : 'kg'
                        };
                        setRecipeData({ ...recipeData, ingredients: newIngredients });
                      }}
                      style={styles.input}
                      required
                    >
                      <option value="">Select ingredient</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.name}>
                          {ing.name} ({ing.unit}) {ing.quantity > 0 ? '' : ' [OUT OF STOCK]'}
                        </option>
                      ))}
                    </select>
                    <div style={styles.formRow}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Quantity"
                        value={ing.quantity}
                        onChange={(e) => {
                          const newIngredients = [...recipeData.ingredients];
                          newIngredients[idx].quantity = e.target.value;
                          setRecipeData({ ...recipeData, ingredients: newIngredients });
                        }}
                        style={{ ...styles.input, marginTop: '8px' }}
                        required
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddIngredientToRecipe}
                  style={{ ...styles.buttonSecondary, marginTop: '8px' }}
                >
                  + Add Ingredient
                </button>
              </div>
              <div style={styles.formButtons}>
                <button type="submit" style={styles.buttonPrimary}>
                  {editingRecipeId ? 'Update Recipe' : 'Create Recipe'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecipeForm(false)}
                  style={styles.buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Sell Modal */}
      {showQuickSell && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>🛒 Quick Sell Ramen</h2>
              <button onClick={() => setShowQuickSell(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <form onSubmit={handleQuickSell} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ramen Type *</label>
                <select
                  value={quickSellData.recipeId}
                  onChange={(e) => setQuickSellData({ ...quickSellData, recipeId: e.target.value })}
                  style={styles.input}
                  required
                >
                  <option value="">Select ramen type</option>
                  {recipes.map((recipe) => {
                    const { profit } = getRecipeProfit(recipe);
                    return (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name} (₱{recipe.price}) - Profit: ₱{profit.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {quickSellData.recipeId && recipes.find(r => r.id === quickSellData.recipeId) && (
                <div style={{
                  ...styles.card,
                  marginBottom: '16px',
                  background: '#f0fdf4',
                  border: '1px solid #86efac'
                }}>
                  {(() => {
                    const recipe = recipes.find(r => r.id === quickSellData.recipeId);
                    const { cost, profit, margin } = getRecipeProfit(recipe);
                    const quantity = parseInt(quickSellData.quantity) || 0;
                    const totalRevenue = recipe.price * quantity;
                    const totalCost = cost * quantity;
                    const totalProfit = profit * quantity;

                    return (
                      <div>
                        <div style={{ ...styles.cardTitle, color: '#166534', marginBottom: '12px' }}>
                          💚 Per Bowl Breakdown
                        </div>
                        <div style={{ fontSize: '13px', color: '#1f2937', marginBottom: '8px' }}>
                          💰 Selling Price: <strong>₱{recipe.price}</strong>
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                          📦 Ingredient Cost: <strong>₱{cost.toFixed(2)}</strong>
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600',
                          color: '#166534',
                          paddingTop: '8px',
                          borderTop: '1px solid #86efac'
                        }}>
                          Your Profit: ₱{profit.toFixed(2)} ({margin}%)
                        </div>

                        {quantity > 0 && (
                          <div style={{
                            marginTop: '16px',
                            paddingTop: '12px',
                            borderTop: '2px solid #86efac'
                          }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                              <strong>📈 If You Sell {quantity} Bowl{quantity !== 1 ? 's' : ''}:</strong>
                            </div>
                            <div style={{ fontSize: '13px', color: '#1f2937', marginBottom: '6px' }}>
                              💵 Total Revenue: <strong>₱{totalRevenue.toLocaleString()}</strong>
                            </div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                              📦 Total Cost: <strong>₱{totalCost.toFixed(2).toLocaleString()}</strong>
                            </div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#166534',
                              paddingTop: '8px',
                              borderTop: '1px solid #86efac'
                            }}>
                              💚 Your Total Profit: ₱{totalProfit.toFixed(2).toLocaleString()} ✅
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Quantity Sold *</label>
                <input
                  type="number"
                  min="1"
                  value={quickSellData.quantity}
                  onChange={(e) => setQuickSellData({ ...quickSellData, quantity: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formButtons}>
                <button type="submit" style={{ ...styles.buttonPrimary, background: '#10b981' }}>
                  ✅ Record Sale
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickSell(false)}
                  style={styles.buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>💸 Add Expense</h2>
              <button onClick={() => setShowAddExpense(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddExpense} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Expense Category *</label>
                <input
                  type="text"
                  placeholder="e.g., Cable, Groceries, Gas, etc."
                  value={expenseData.category}
                  onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date *</label>
                <input
                  type="date"
                  value={expenseData.date}
                  onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formButtons}>
                <button type="submit" style={{ ...styles.buttonPrimary, background: '#dc2626' }}>
                  ✅ Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
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
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#d97706',
    background: '#faf9f7',
  },
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
    background: '#faf9f7',
  },
  loginBox: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  header: {
    background: 'white',
    borderBottom: '2px solid #d97706',
    padding: '20px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#d97706',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: {
    fontSize: '14px',
    color: '#6b7280',
  },
  nav: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 20px',
    display: 'flex',
    gap: '8px',
    maxWidth: '1200px',
    margin: '0 auto',
    overflowX: 'auto',
  },
  navButton: {
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  navButtonActive: {
    color: '#d97706',
    borderBottomColor: '#d97706',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#d97706',
  },
  card: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '24px',
  },
  actionButton: {
    padding: '12px 16px',
    background: '#d97706',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  alertList: {
    marginTop: '12px',
  },
  alertItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  alertName: {
    color: '#1f2937',
    fontWeight: '500',
  },
  alertQty: {
    color: '#e8341c',
    fontWeight: '600',
  },
  filtersContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    flex: 1,
    minWidth: '150px',
  },
  selectInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'white',
  },
  tableHeader: {
    background: '#f3f4f6',
  },
  tableCell: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
    borderBottom: '1px solid #e5e7eb',
  },
  tableRow: {
    ':hover': {
      background: '#f9fafb',
    },
  },
  recipesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '20px',
  },
  recipeCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #d97706',
  },
  recipeTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 12px 0',
  },
  recipePrice: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#d97706',
    marginBottom: '12px',
  },
  priceLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  ingredientsList: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#4b5563',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
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
    marginBottom: '6px',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  formButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  buttonPrimary: {
    background: '#d97706',
    color: 'white',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  buttonSecondary: {
    background: '#f3f4f6',
    color: '#374151',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
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
  errorAlert: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  transactionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  transactionCard: {
    background: '#f9fafb',
    padding: '12px',
    borderRadius: '6px',
    borderLeft: '4px solid #d97706',
  },
  transactionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  transactionBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: '12px',
    color: '#6b7280',
  },
  transactionDetails: {
    fontSize: '13px',
    color: '#1f2937',
  },
  transactionQty: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  transactionValue: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  transactionNotes: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  emptyState: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '20px',
    fontSize: '14px',
  },
};

export default RamenInventoryApp;