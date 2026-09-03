// HARDCODE SETUP SCRIPT
// Run this ONCE to load all paper data into Firebase
// After running, DELETE this file and the HARDCODED_DATA.js file

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { 
  HARDCODED_INVENTORY, 
  HARDCODED_RECIPES, 
  HARDCODED_SALES,
  HARDCODED_EXPENSES 
} from './HARDCODED_DATA';

const ADMIN_UID = 'jeanneacosta@yahoo.com'; // Replace with actual admin UID from Firebase

export const setupHardcodedData = async (adminUserId) => {
  try {
    console.log('🚀 Starting hardcoded data setup...');

    // 1. ADD INVENTORY
    console.log('📦 Adding inventory...');
    for (const ingredient of HARDCODED_INVENTORY) {
      await addDoc(collection(db, 'ingredients'), {
        ...ingredient,
        totalValue: ingredient.quantity * ingredient.unitPrice,
        userId: adminUserId,
        createdAt: serverTimestamp(),
      });
    }
    console.log(`✅ Added ${HARDCODED_INVENTORY.length} ingredients`);

    // 2. ADD RECIPES
    console.log('📖 Adding recipes...');
    const recipeRefs = {};
    for (const recipe of HARDCODED_RECIPES) {
      const docRef = await addDoc(collection(db, 'recipes'), {
        ...recipe,
        createdAt: serverTimestamp(),
        createdBy: ADMIN_UID,
      });
      recipeRefs[recipe.name] = docRef.id;
    }
    console.log(`✅ Added ${HARDCODED_RECIPES.length} recipes`);

    // 3. ADD SALES
    console.log('💰 Adding sales records...');
    for (const sale of HARDCODED_SALES) {
      await addDoc(collection(db, 'sales'), {
        ...sale,
        createdAt: serverTimestamp(),
      });
    }
    console.log(`✅ Added ${HARDCODED_SALES.length} sales`);

    // 4. ADD EXPENSES
    console.log('💸 Adding expense records...');
    for (const expense of HARDCODED_EXPENSES) {
      await addDoc(collection(db, 'expenses'), {
        ...expense,
        createdAt: serverTimestamp(),
      });
    }
    console.log(`✅ Added ${HARDCODED_EXPENSES.length} expenses`);

    console.log('✅✅✅ All data loaded successfully!');
    console.log('🎉 Ready to start tracking!');
    return true;
  } catch (error) {
    console.error('❌ Error loading data:', error);
    return false;
  }
};

// USAGE: Call this ONCE when app starts (if first time)
// setupHardcodedData(authUser.id)
