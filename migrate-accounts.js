// Migration script to add userId to existing accounts
// Run this in the browser console while logged in to the app

(async function migrateAccounts() {
    console.log("🔍 Starting account migration check...");

    // Get current user
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("❌ No user logged in! Please log in first.");
        return;
    }

    console.log("✅ User:", user.email, "UID:", user.uid);

    // Get all accounts for this user
    const db = firebase.firestore();
    const accountsSnapshot = await db.collection('accounts')
        .where('userId', '==', user.uid)
        .get();

    console.log(`📊 Found ${accountsSnapshot.docs.length} accounts with userId`);

    // Check for accounts WITHOUT userId (legacy accounts)
    const allAccountsSnapshot = await db.collection('accounts').get();
    console.log(`📊 Total accounts in database: ${allAccountsSnapshot.docs.length}`);

    const accountsWithoutUserId = allAccountsSnapshot.docs.filter(doc => !doc.data().userId);
    console.log(`⚠️  Accounts without userId: ${accountsWithoutUserId.length}`);

    if (accountsWithoutUserId.length > 0) {
        console.log("🔧 Updating accounts to add userId...");

        for (const doc of accountsWithoutUserId) {
            await doc.ref.update({ userId: user.uid });
            console.log(`✅ Updated account: ${doc.id} (${doc.data().name})`);
        }

        console.log("✅✅✅ Migration complete! All accounts now have userId.");
        console.log("🔄 Please refresh the page and try deleting again.");
    } else {
        console.log("✅ All accounts already have userId. No migration needed.");
        console.log("🔍 Checking account details...");

        accountsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`  - ${data.name} (${doc.id}): userId = ${data.userId}`);
        });
    }
})();
